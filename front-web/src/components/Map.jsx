import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getSignalements } from "../api/client";

const DEFAULT_CENTER = [47.5079, -18.8792]; // Antananarivo (lng, lat)

function osmRasterStyle() {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "osm-raster",
        type: "raster",
        source: "osm",
        paint: {
          "raster-saturation": 0.1,
          "raster-contrast": 0.1,
        },
      },
    ],
  };
}

// Couleurs par statut (cohérent avec le backend)
const STATUT_COLORS = {
  actif: '#ef4444',      // rouge
  en_cours: '#f59e0b',   // jaune/orange
  resolu: '#22c55e',     // vert
  rejete: '#94a3b8',     // gris
};

function statusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "actif" || s === "nouveau") return "Actif";
  if (s === "en_cours" || s === "en cours" || s === "encours") return "En cours";
  if (s === "resolu" || s === "terminé" || s === "termine") return "Résolu";
  if (s === "rejete") return "Rejeté";
  return status ? String(status) : "—";
}

function statusWeight(status) {
  const s = String(status || "").toLowerCase();
  if (s === "resolu" || s === "terminé" || s === "termine") return 100;
  if (s === "en_cours" || s === "en cours" || s === "encours") return 50;
  if (s === "actif" || s === "nouveau") return 0;
  return 0;
}

function formatNumber(value, opts = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("fr-FR", opts).format(n);
}

function formatMoneyMGA(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "0 MGA";
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MGA" }).format(n);
  } catch {
    return `${formatNumber(n)} MGA`;
  }
}

function photoFullUrl(photoUrl) {
  if (!photoUrl) return null;
  if (String(photoUrl).startsWith('http')) return photoUrl;
  return `${window.location.protocol}//${window.location.hostname}:3001${photoUrl}`;
}
export default function Map() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [error, setError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [signalements, setSignalements] = useState([]);
  const didFitRef = useRef(false);
  const geojsonRef = useRef({ type: 'FeatureCollection', features: [] });
  const containerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isRecapVisible, setIsRecapVisible] = useState(true);

  useEffect(() => {
    if (mapRef.current) return;

    let cancelled = false;

    async function init() {
      try {
        if (cancelled) return;

        if (!mapContainer.current) {
          return;
        }

        mapRef.current = new maplibregl.Map({
          container: mapContainer.current,
          style: osmRasterStyle(),
          center: DEFAULT_CENTER,
          zoom: 12,
          attributionControl: false,
        });

        mapRef.current.on('error', (e) => {
          console.error('maplibre error event', e);
          setError(e && e.error ? String(e.error) : String(e));
        });

        mapRef.current.on('webglcontextlost', () => {
          setError('WebGL context perdu. Rafraîchissez la page ou fermez les autres onglets lourds.');
        });

        mapRef.current.on('load', () => {
          // Add attribution (bottom-right), keeps a clean UI
          try {
            mapRef.current.addControl(
              new maplibregl.AttributionControl({ compact: true }),
              'bottom-right',
            );
          } catch {
            // ignore
          }

          // Prepare empty source + layer for signalements
          const map = mapRef.current;
          if (!map.getSource('signalements')) {
            map.addSource('signalements', {
              type: 'geojson',
              data: geojsonRef.current,
            });
          }

          if (!map.getLayer('signalements-circles')) {
            map.addLayer({
              id: 'signalements-circles',
              type: 'circle',
              source: 'signalements',
              paint: {
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  6,
                  4,
                  12,
                  7,
                  16,
                  10,
                ],
                'circle-color': [
                  'match',
                  ['get', 'statut'],
                  'actif',
                  '#ef4444',
                  'en_cours',
                  '#f59e0b',
                  'resolu',
                  '#22c55e',
                  'rejete',
                  '#94a3b8',
                  '#38bdf8',
                ],
                'circle-opacity': 0.9,
                'circle-stroke-color': 'rgba(15, 23, 42, 0.9)',
                'circle-stroke-width': 2,
              },
            });
          }

          // Labels showing avancement (%) above each marker
          if (!map.getLayer('signalements-labels')) {
            map.addLayer({
              id: 'signalements-labels',
              type: 'symbol',
              source: 'signalements',
              layout: {
                'text-field': ['concat', ['to-string', ['coalesce', ['get', 'avancement'], 0]], '%'],
                'text-size': 12,
                'text-offset': [0, -1.4],
                'text-anchor': 'bottom',
                'text-allow-overlap': false,
              },
              paint: {
                'text-color': '#0f172a',
                'text-halo-color': 'rgba(255,255,255,0.9)',
                'text-halo-width': 2,
              },
            });
          }
          

          // Hover tooltip
          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'signalement-popup',
            maxWidth: '320px',
          });

          // current photo URL shown in popup (used by key handler)
          let currentPopupPhotoUrl = null;
          let currentPopupKeyHandler = null;

          map.on('mouseenter', 'signalements-circles', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            // Changer la palette en noir au survol
            map.setPaintProperty('osm-raster', 'raster-saturation', -1);
            map.setPaintProperty('osm-raster', 'raster-brightness-max', 0.5);
            map.setPaintProperty('osm-raster', 'raster-contrast', 0.3);
          });
          map.on('mouseleave', 'signalements-circles', () => {
            map.getCanvas().style.cursor = '';
            popup.remove();
            // remove key handler when leaving
            if (currentPopupKeyHandler) {
              try { document.removeEventListener('keydown', currentPopupKeyHandler) } catch {}
              currentPopupKeyHandler = null;
              currentPopupPhotoUrl = null;
            }
            // Rétablir la palette normale
            map.setPaintProperty('osm-raster', 'raster-saturation', 0.1);
            map.setPaintProperty('osm-raster', 'raster-brightness-max', 1);
            map.setPaintProperty('osm-raster', 'raster-contrast', 0.1);
          });

          map.on('mousemove', 'signalements-circles', (e) => {
            const feature = e.features && e.features[0];
            if (!feature) return;

            const props = feature.properties || {};
            const d = props.dateSignalement ? new Date(props.dateSignalement) : null;
            const dateText = d && !Number.isNaN(d.getTime()) ? d.toLocaleString('fr-FR') : '—';

            const surface = props.surfaceM2 != null && props.surfaceM2 !== '' ? `${formatNumber(props.surfaceM2)} m²` : '—';
            const budget = props.budget != null && props.budget !== '' ? formatMoneyMGA(props.budget) : '—';
            const entreprise = props.entrepriseNom || '—';

            // Niveau (avancement)
            const st = String(props.statut || '').toLowerCase();
            const avancement = props.avancement != null ? Number(props.avancement) : statusWeight(st);
            const avColor = avancement >= 100 ? '#22c55e' : avancement >= 50 ? '#eab308' : '#d1d5db';

            // Lien vers la photo
            const photoUrl = props.photoUrl ? photoFullUrl(props.photoUrl) : null;
            const photoLink = photoUrl
              ? `<div style="margin-top:8px;"><a href="${photoUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;color:#6366f1;text-decoration:none;font-weight:500;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'"><i class="fa fa-camera"></i> Voir la photo</a><div style="font-size:11px;color:#94a3b8;margin-top:6px;">Appuyez sur Entrée pour ouvrir la photo</div></div>`
              : '';

            const html = `
              <div class="p-2">
                <div class="text-sm font-semibold text-slate-900">Problème routier</div>
                <div class="mt-1 grid gap-1 text-xs text-slate-700">
                  <div><span class="text-slate-500">Date :</span> ${dateText}</div>
                  <div><span class="text-slate-500">Statut :</span> ${statusLabel(props.statut)}</div>
                  <div><span class="text-slate-500">Surface :</span> ${surface}</div>
                  <div><span class="text-slate-500">Budget :</span> ${budget}</div>
                  <div><span class="text-slate-500">Entreprise :</span> ${entreprise}</div>
                  <div><span class="text-slate-500">Niveau :</span> <span style="font-weight:700;color:${avColor}">${avancement}%</span></div>
                  <div style="height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-top:2px;">
                    <div style="height:100%;width:${avancement}%;background:${avColor};border-radius:3px;"></div>
                  </div>
                  ${photoLink}
                </div>
              </div>
            `;

            popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
            // install key handler to open photo on Enter
            try {
              if (currentPopupKeyHandler) {
                document.removeEventListener('keydown', currentPopupKeyHandler);
                currentPopupKeyHandler = null;
                currentPopupPhotoUrl = null;
              }
              if (photoUrl) {
                currentPopupPhotoUrl = photoUrl;
                currentPopupKeyHandler = (ev) => {
                  if (ev.key === 'Enter' && currentPopupPhotoUrl) {
                    window.open(currentPopupPhotoUrl, '_blank');
                  }
                };
                document.addEventListener('keydown', currentPopupKeyHandler);
              }
            } catch (e) {
              // ignore
            }
          });

          // In case data arrived before map load
          try {
            const src = map.getSource('signalements');
            if (src && typeof src.setData === 'function') {
              src.setData(geojsonRef.current);
            }
          } catch {
            // ignore
          }

          setMapReady(true);
        });

        mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      } catch (e) {
        console.error('Failed to initialize maplibre:', e);
        setError(String(e));
      }
    }

    init();

    return () => {
      cancelled = true;
      try {
        mapRef.current?.remove();
      } finally {
        // Important in React StrictMode (dev): effects are mounted/unmounted once,
        // so we must clear refs to allow proper re-init.
        mapRef.current = null;
        didFitRef.current = false;
      }
    };
  }, []);

  async function refreshSignalements() {
    setLoading(true);
    setApiError(null);
    try {
      const data = await getSignalements();
      setSignalements(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.message ? String(e.message) : String(e);
      // If unauthorized, attempt a best-effort unauthenticated fetch (in case backend allows public access)
      if (msg.toLowerCase().includes('authorization') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('missing')) {
        try {
          const url = `${window.location.protocol}//${window.location.hostname}:3001/signalements/geojson`;
          const res = await fetch(url, { method: 'GET' });
          if (res.ok) {
            const geojson = await res.json();
            geojsonRef.current = geojson;
            const map = mapRef.current;
            try {
              const src = map && map.getSource && map.getSource('signalements');
              if (src && typeof src.setData === 'function') src.setData(geojson);
            } catch {}
            const list = geojson.features.map((f) => ({
              id: f.properties?.id,
              ...f.properties,
              longitude: f.geometry?.coordinates?.[0],
              latitude: f.geometry?.coordinates?.[1],
            }));
            setSignalements(list);
            setApiError(null);
            return;
          }
          // unauth fetch failed -> show login hint
          setApiError('Accès refusé à l\'API GeoJSON (401). Connectez-vous pour voir les signalements.');
        } catch (e2) {
          setApiError('Erreur lors de la récupération des signalements: ' + (e2?.message || String(e2)));
        }
      } else {
        setApiError(msg);
      }
      setSignalements([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSignalements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Géolocalisation utilisateur
  function handleLocateUser() {
    if (!navigator.geolocation) {
      setApiError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }
    setApiError(null);

    function onSuccess(position) {
      const { latitude, longitude } = position.coords;
      setApiError(null);
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15, duration: 1000 });
      }
      if (userMarkerRef.current) userMarkerRef.current.remove();
      const el = document.createElement('div');
      el.style.cssText = 'width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);';
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML('<div style="padding:4px;font-size:13px;font-weight:600;">Vous êtes ici</div>'))
        .addTo(mapRef.current);
      userMarkerRef.current.togglePopup();
    }

    function onError(err) {
      if (err.code === 1) setApiError('Géolocalisation refusée. Activez-la dans les paramètres de votre navigateur.');
      else if (err.code === 2) setApiError('Position indisponible. Vérifiez que votre GPS est activé.');
      else if (err.code === 3) setApiError('Délai de géolocalisation dépassé. Réessayez.');
      else setApiError('Impossible d\'obtenir votre position: ' + err.message);
    }

    // Essayer d'abord avec haute précision, puis fallback sans
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onError,
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }

  // Plein écran
  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  useEffect(() => {
    function onFsChange() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Recherche d'adresse via Nominatim
  async function handleSearch(e) {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=mg&limit=5`
      );
      const data = await res.json();
      setSearchResults(data || []);
      if (data?.length > 0 && mapRef.current) {
        mapRef.current.flyTo({
          center: [parseFloat(data[0].lon), parseFloat(data[0].lat)],
          zoom: 15,
          duration: 1000
        });
      }
    } catch {
      setApiError('Erreur lors de la recherche d\'adresse');
    } finally {
      setSearchLoading(false);
    }
  }

  function selectSearchResult(result) {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [parseFloat(result.lon), parseFloat(result.lat)],
        zoom: 16,
        duration: 1000
      });
    }
    setSearchResults([]);
    setSearchQuery(result.display_name.split(',').slice(0, 2).join(','));
  }

  // Sync map source when signalements change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const features = (signalements || [])
      .map((s) => {
        const lng = Number(s.longitude);
        const lat = Number(s.latitude);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            id: s.id,
            statut: s.statut,
            avancement: s.avancement,
            dateSignalement: s.dateSignalement,
            surfaceM2: s.surfaceM2,
            budget: s.budget,
            entrepriseNom: s.entreprise?.nom,
            photoUrl: s.photoUrl,
          },
        };
      })
      .filter(Boolean);

    const geojson = { type: 'FeatureCollection', features };
    geojsonRef.current = geojson;

    // Guard: map may exist but style not ready yet
    try {
      const style = map.getStyle && map.getStyle();
      if (!style || !map.isStyleLoaded?.()) return;
      const src = map.getSource('signalements');
      if (src && typeof src.setData === 'function') {
        src.setData(geojson);
      }
    } catch {
      return;
    }

    if (!didFitRef.current && features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      for (const f of features) bounds.extend(f.geometry.coordinates);
      didFitRef.current = true;
      try {
        map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 800 });
      } catch {
        // ignore
      }
    }
  }, [signalements, mapReady]);

  const recap = useMemo(() => {
    const list = Array.isArray(signalements) ? signalements : [];
    const total = list.length;
    let surfaceTotal = 0;
    let budgetTotal = 0;
    let progressSum = 0;
    let done = 0;

    for (const s of list) {
      surfaceTotal += Number(s.surfaceM2 || 0) || 0;
      budgetTotal += Number(s.budget || 0) || 0;
      // Utiliser l'avancement stocké en BDD si disponible, sinon calculer depuis le statut
      progressSum += s.avancement != null ? Number(s.avancement) : statusWeight(s.statut);
      const st = String(s.statut || '').toLowerCase();
      if (st === 'resolu' || st === 'terminé' || st === 'termine') done += 1;
    }

    const progressPct = total > 0 ? Math.round(progressSum / total) : 0;
    const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, surfaceTotal, budgetTotal, progressPct, donePct };
  }, [signalements]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <style>{`
        .signalement-popup .maplibregl-popup-content {
          background: rgba(255, 255, 255, 0.95);
          color: #000000;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          padding: 0;
        }
        .signalement-popup .maplibregl-popup-tip {
          border-top-color: rgba(255, 255, 255, 0.95);
        }
      `}</style>

      <div className="h-full w-full overflow-hidden border border-slate-200 bg-white shadow-lg">
        <div ref={mapContainer} className="h-full w-full" />
      </div>

      {/* Contrôles carte: Recherche + Localisation + Plein écran */}
      <div className="absolute top-3 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:top-4 z-[10] flex flex-col items-center gap-2">
        <form onSubmit={handleSearch} className="flex gap-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Rechercher un lieu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-lg bg-white/95 backdrop-blur px-3 py-2 pl-8 text-sm border border-slate-300 shadow-lg focus:border-indigo-500 focus:outline-none"
            />
            <i className="fa fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm shadow-lg hover:bg-indigo-600 disabled:opacity-50"
          >
            {searchLoading ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-search" />}
          </button>
          <button
            type="button"
            onClick={handleLocateUser}
            className="px-3 py-2 rounded-lg bg-white/95 backdrop-blur text-blue-600 border border-slate-300 text-sm shadow-lg hover:bg-blue-50"
            title="Ma position"
          >
            <i className="fa fa-crosshairs" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-2 rounded-lg bg-white/95 backdrop-blur text-slate-700 border border-slate-300 text-sm shadow-lg hover:bg-slate-100"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            <i className={`fa ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
          </button>
        </form>

        {/* Résultats de recherche */}
        {searchResults.length > 0 && (
          <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate-200 max-h-48 overflow-y-auto w-full sm:w-80">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => selectSearchResult(r)}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 border-b border-gray-100 last:border-0"
              >
                <i className="fa fa-map-marker mr-2 text-indigo-500" />
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-3 top-16 right-3 flex flex-col gap-3 sm:left-4 sm:right-auto sm:w-[320px] md:w-[400px]">
        {isRecapVisible ? (
          <div className="pointer-events-auto relative resize overflow-auto min-w-[240px] min-h-[140px] max-w-[90vw] max-h-[70vh] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-800">Carte des problèmes routiers</div>
              <div className="mt-1 text-xs text-slate-500">
                Points: <span className="text-slate-800 font-semibold">{recap.total}</span>
                {loading ? <span className="ml-2 text-slate-400">(chargement…)</span> : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecapVisible(false)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
                title="Masquer le panneau"
              >
                <i className="fa fa-chevron-left" aria-hidden="true" />
                {/* <span className="ml-1">Cacher</span> */}
              </button>
              <button
                type="button"
                onClick={refreshSignalements}
                className="rounded-xl border border-slate-200 bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600 shadow-sm"
              >
                Actualiser
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <div className="text-slate-500">Surface totale</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{formatNumber(recap.surfaceTotal, { maximumFractionDigits: 2 })} m²</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <div className="text-slate-500">Budget total</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{formatMoneyMGA(recap.budgetTotal)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <div className="text-slate-500">Avancement</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{recap.progressPct}%</div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.max(0, recap.progressPct))}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Terminé: {recap.donePct}%</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <div className="text-slate-500">Légende</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} /> Actif
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} /> En cours
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} /> Résolu
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#94a3b8' }} /> Rejeté
                </span>
              </div>
            </div>
          </div>
          </div>
        ) : (
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsRecapVisible(true)}
              className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow hover:bg-white"
              title="Afficher le panneau"
            ><i className="fa fa-chevron-right mr-2" aria-hidden="true" />
            </button>
          </div>
        )}

        {apiError ? (
          <div className="pointer-events-auto rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            Erreur API: {apiError}
          </div>
        ) : null}

        {error ? (
          <div className="pointer-events-auto rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            Erreur carte: {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
