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

function statusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "nouveau") return "Nouveau";
  if (s === "en cours" || s === "encours") return "En cours";
  if (s === "terminé" || s === "termine") return "Terminé";
  return status ? String(status) : "—";
}

function statusWeight(status) {
  const s = String(status || "").toLowerCase();
  if (s === "terminé" || s === "termine") return 100;
  if (s === "en cours" || s === "encours") return 50;
  if (s === "nouveau") return 0;
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

export default function Map() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [error, setError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signalements, setSignalements] = useState([]);
  const didFitRef = useRef(false);
  const geojsonRef = useRef({ type: 'FeatureCollection', features: [] });
  const containerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

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
                  ['downcase', ['get', 'statut']],
                  'nouveau',
                  '#ef4444',
                  'en cours',
                  '#f59e0b',
                  'terminé',
                  '#22c55e',
                  'termine',
                  '#22c55e',
                  '#38bdf8',
                ],
                'circle-opacity': 0.9,
                'circle-stroke-color': 'rgba(15, 23, 42, 0.9)',
                'circle-stroke-width': 2,
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

            const html = `
              <div class="p-2">
                <div class="text-sm font-semibold text-slate-900">Problème routier</div>
                <div class="mt-1 grid gap-1 text-xs text-slate-700">
                  <div><span class="text-slate-500">Date:</span> ${dateText}</div>
                  <div><span class="text-slate-500">Statut:</span> ${statusLabel(props.statut)}</div>
                  <div><span class="text-slate-500">Surface:</span> ${surface}</div>
                  <div><span class="text-slate-500">Budget:</span> ${budget}</div>
                  <div><span class="text-slate-500">Entreprise:</span> ${entreprise}</div>
                </div>
              </div>
            `;

            popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
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
      setApiError(e?.message ? String(e.message) : String(e));
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
            dateSignalement: s.dateSignalement,
            surfaceM2: s.surfaceM2,
            budget: s.budget,
            entrepriseNom: s.entreprise?.nom,
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
  }, [signalements]);

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
      progressSum += statusWeight(s.statut);
      const st = String(s.statut || '').toLowerCase();
      if (st === 'terminé' || st === 'termine') done += 1;
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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10] flex flex-col items-center gap-2">
        <form onSubmit={handleSearch} className="flex gap-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une rue, un lieu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-lg bg-white/95 backdrop-blur px-3 py-2 pl-8 text-sm border border-slate-300 shadow-lg focus:border-indigo-500 focus:outline-none"
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
          <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate-200 max-h-48 overflow-y-auto w-80">
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

      <div className="pointer-events-none absolute left-4 top-16 right-4 flex flex-col gap-3 md:right-auto md:w-[400px]">
        <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-800">Carte des problèmes routiers</div>
              <div className="mt-1 text-xs text-slate-500">
                Points: <span className="text-slate-800 font-semibold">{recap.total}</span>
                {loading ? <span className="ml-2 text-slate-400">(chargement…)</span> : null}
              </div>
            </div>

            <button
              type="button"
              onClick={refreshSignalements}
              className="rounded-xl border border-slate-200 bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600 shadow-sm"
            >
              Actualiser
            </button>
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
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Nouveau
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> En cours
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Terminé
                </span>
              </div>
            </div>
          </div>
        </div>

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
