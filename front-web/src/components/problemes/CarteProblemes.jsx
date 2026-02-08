import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getTypesProblemeActifs } from '../../api/problemes.js'
import { getSignalementsGeoJSON } from '../../api/client.js'

// Style de carte OSM raster (comme dans Map.jsx)
function osmRasterStyle() {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
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

export default function CarteProblemes({ selectedProbleme, onProblemeCreated, onMarkerClick, selectedProblemeId }) {
  const navigate = useNavigate()
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [problemes, setProblemes] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [filtreStatut, setFiltreStatut] = useState(null)
  const [isAddMode, setIsAddMode] = useState(false)
  const [mapError, setMapError] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [userPosition, setUserPosition] = useState(null)
  const userMarkerRef = useRef(null)
  const containerRef = useRef(null)

  // Charger les données
  useEffect(() => {
    loadData()
  }, [filtreStatut])

  // Initialiser la carte MapLibre avec style OSM
  useEffect(() => {
    if (mapRef.current) return

    async function initMap() {
      try {
        mapRef.current = new maplibregl.Map({
          container: mapContainer.current,
          style: osmRasterStyle(),
          center: [47.5079, -18.8792], // Antananarivo
          zoom: 12,
          attributionControl: false,
        })

        mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')
        mapRef.current.addControl(
          new maplibregl.AttributionControl({ compact: true }),
          'bottom-right'
        )

        mapRef.current.on('load', () => {
          console.log('Carte chargée')
          setMapReady(true)
        })

        mapRef.current.on('error', (e) => {
          console.error('Erreur carte:', e)
          setMapError(e.error?.message || 'Erreur de chargement de la carte')
        })

      } catch (e) {
        console.error('Erreur initialisation carte:', e)
        setMapError(String(e))
      }
    }

    initMap()

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Mettre à jour le mode clic et gérer le clic sur la carte
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.getCanvas().style.cursor = isAddMode ? 'crosshair' : ''

    // Gestionnaire de clic pour rediriger vers la page de signalement
    const handleMapClick = (e) => {
      if (isAddMode) {
        navigate(`/signaler-probleme?lat=${e.lngLat.lat}&lng=${e.lngLat.lng}`)
      }
    }

    mapRef.current.on('click', handleMapClick)

    return () => {
      mapRef.current?.off('click', handleMapClick)
    }
  }, [isAddMode, navigate])

  // Centrer sur le problème sélectionné
  useEffect(() => {
    if (selectedProbleme && mapRef.current) {
      mapRef.current.flyTo({
        center: [parseFloat(selectedProbleme.longitude), parseFloat(selectedProbleme.latitude)],
        zoom: 15,
        duration: 1000
      })
    }
  }, [selectedProbleme])

  // Afficher les marqueurs des problèmes — attend que la carte soit prête
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Ajouter les nouveaux marqueurs
    // Couleurs par statut
    const STATUT_COLORS = {
      actif: '#ef4444',      // rouge
      en_cours: '#f59e0b',   // jaune/orange
      resolu: '#22c55e',     // vert
      rejete: '#94a3b8',     // gris
    }

    problemes.forEach((feature) => {
      const props = feature.properties
      const coords = feature.geometry.coordinates
      const typeInfo = props.typeProbleme
      const couleurStatut = STATUT_COLORS[props.statut] || '#38bdf8'
      const opacity = props.statut === 'resolu' ? 0.6 : 1

      // Vérifier si ce marqueur est sélectionné
      const isSelected = selectedProblemeId && props.id === selectedProblemeId

      // Créer l'élément du marqueur
      const el = document.createElement('div')
      el.className = 'probleme-marker'
      el.style.cssText = `
        width: ${isSelected ? '40px' : '30px'};
        height: ${isSelected ? '40px' : '30px'};
        background-color: ${couleurStatut};
        border: ${isSelected ? '4px solid #4f46e5' : '3px solid white'};
        border-radius: 50%;
        box-shadow: ${isSelected ? '0 0 12px rgba(79,70,229,0.6)' : '0 2px 6px rgba(0,0,0,0.3)'};
        opacity: ${opacity};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: ${isSelected ? '100' : '1'};
      `
      el.innerHTML = '<i class="fa fa-warning" style="color: white; font-size: 13px;"></i>'

      // Calculer l'avancement depuis le statut
      const avancement = props.avancement ?? (props.statut === 'resolu' ? 100 : props.statut === 'en_cours' ? 50 : 0)
      const avancementColor = avancement >= 100 ? '#22c55e' : avancement >= 50 ? '#eab308' : '#d1d5db'

      // Ajouter l'événement click pour la synchronisation avec le tableau
      el.addEventListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick({
            id: props.id,
            ...props,
            longitude: coords[0],
            latitude: coords[1]
          })
        }
      })

      // Créer le popup
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="min-width: 220px; padding: 8px;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${props.titre}</div>
          ${typeInfo ? `<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: white; background-color: ${typeInfo.couleur}; margin-bottom: 8px;">${typeInfo.nom}</span>` : ''}
          ${props.description ? `<p style="font-size: 13px; color: #475569; margin: 8px 0;">${props.description}</p>` : ''}
          ${props.adresse ? `<p style="font-size: 12px; color: #64748b;"><i class="fa fa-map-marker" style="margin-right: 4px;"></i>${props.adresse}</p>` : ''}
          <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
            Statut: <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:white;background-color:${couleurStatut};">${props.statut === 'actif' ? 'Actif' : props.statut === 'en_cours' ? 'En cours' : props.statut === 'resolu' ? 'Résolu' : props.statut === 'rejete' ? 'Rejeté' : props.statut}</span>
          </div>
          <div style="margin-top: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 11px; color: #64748b;">Avancement</span>
              <span style="font-size: 12px; font-weight: 700; color: #1e293b;">${avancement}%</span>
            </div>
            <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${avancement}%; background: ${avancementColor}; border-radius: 3px; transition: width 0.3s;"></div>
            </div>
          </div>
          ${props.priorite > 1 ? `<div style="font-size: 12px; color: #ea580c; margin-top: 4px;"><i class="fa fa-flag" style="margin-right: 4px;"></i>Priorité ${props.priorite}</div>` : ''}
        </div>
      `)

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coords[0], coords[1]])
        .setPopup(popup)
        .addTo(mapRef.current)

      markersRef.current.push(marker)
    })
  }, [problemes, selectedProblemeId,mapReady, onMarkerClick])

  async function loadData() {
    setLoading(true)
    setApiError(null)
    try {
      const [geoData, typesData] = await Promise.all([
        getSignalementsGeoJSON(filtreStatut),
        getTypesProblemeActifs(),
      ])
      setProblemes(geoData?.features || [])
      setTypes(typesData || [])
    } catch (e) {
      const msg = e?.message || String(e)
      console.error('Erreur chargement données:', msg)
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Géolocalisation utilisateur
  function handleLocateUser() {
    if (!navigator.geolocation) {
      setApiError('La géolocalisation n\'est pas supportée par votre navigateur')
      return
    }
    setApiError(null)

    function onSuccess(position) {
      const { latitude, longitude } = position.coords
      setApiError(null)
      setUserPosition([longitude, latitude])
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15, duration: 1000 })
      }
      // Ajouter/mettre à jour le marqueur utilisateur
      if (userMarkerRef.current) userMarkerRef.current.remove()
      const el = document.createElement('div')
      el.style.cssText = 'width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);'
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML('<div style="padding:4px;font-size:13px;font-weight:600;">Vous êtes ici</div>'))
        .addTo(mapRef.current)
      userMarkerRef.current.togglePopup()
    }

    function onError(err) {
      if (err.code === 1) {
        setApiError('Géolocalisation refusée. Activez-la dans les paramètres de votre navigateur.')
      } else if (err.code === 2) {
        setApiError('Position indisponible. Vérifiez que votre GPS est activé.')
      } else if (err.code === 3) {
        setApiError('Délai de géolocalisation dépassé. Réessayez.')
      } else {
        setApiError('Impossible d\'obtenir votre position: ' + err.message)
      }
    }

    // Essayer d'abord avec haute précision, puis fallback sans
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onError,
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
        )
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    )
  }

  // Plein écran
  function toggleFullscreen() {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Recherche d'adresse via Nominatim
  async function handleSearch(e) {
    e?.preventDefault()
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setSearchResults([])
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=mg&limit=5`
      )
      const data = await res.json()
      setSearchResults(data || [])
      if (data?.length > 0 && mapRef.current) {
        mapRef.current.flyTo({
          center: [parseFloat(data[0].lon), parseFloat(data[0].lat)],
          zoom: 15,
          duration: 1000
        })
      }
    } catch {
      setApiError('Erreur lors de la recherche d\'adresse')
    } finally {
      setSearchLoading(false)
    }
  }

  function selectSearchResult(result) {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [parseFloat(result.lon), parseFloat(result.lat)],
        zoom: 16,
        duration: 1000
      })
    }
    setSearchResults([])
    setSearchQuery(result.display_name.split(',').slice(0, 2).join(','))
  }

  function handleProblemeCreated() {
    setIsAddMode(false)
    loadData()
    onProblemeCreated?.()
  }

  return (
    <div ref={containerRef} className={`relative ${isFullscreen ? 'h-screen' : 'h-[400px] sm:h-[500px] md:h-[600px]'} rounded-xl overflow-hidden border border-gray-200 shadow-sm`}>
      {/* Contrôles de la carte */}
      <div className="absolute top-3 left-3 z-[10] flex flex-col gap-2 max-w-[calc(100%-70px)] sm:max-w-none sm:top-4 sm:left-4">
        {/* Recherche d'adresse */}
        <form onSubmit={handleSearch} className="flex gap-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un lieu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 rounded-lg bg-white px-3 py-2 pl-8 text-sm border border-gray-300 shadow-lg focus:border-indigo-500 focus:outline-none"
            />
            <i className="fa fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm shadow-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {searchLoading ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-search" />}
          </button>
        </form>

        {/* Résultats de recherche */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
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

        <button
          onClick={() => setIsAddMode(!isAddMode)}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
            isAddMode
              ? 'bg-red-600 text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <i className={`fa ${isAddMode ? 'fa-times' : 'fa-plus'} mr-2`} />
          {isAddMode ? 'Annuler' : 'Signaler un problème'}
        </button>

        <select
          value={filtreStatut || ''}
          onChange={(e) => setFiltreStatut(e.target.value || null)}
          className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm shadow-lg"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="en_cours">En cours</option>
          <option value="resolu">Résolus</option>
        </select>

        <div className="flex gap-1">
          <button
            onClick={handleLocateUser}
            className="flex-1 px-3 py-2 rounded-lg bg-white text-blue-600 border border-gray-300 text-sm shadow-lg hover:bg-blue-50"
            title="Ma position"
          >
            <i className="fa fa-crosshairs sm:mr-1" /><span className="hidden sm:inline">Ma position</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 text-sm shadow-lg hover:bg-gray-50"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            <i className={`fa ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
          </button>
          <button
            onClick={loadData}
            className="px-3 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 text-sm shadow-lg hover:bg-gray-50"
            title="Rafraîchir"
          >
            <i className="fa fa-refresh" />
          </button>
        </div>
      </div>

      {/* Message mode ajout */}
      {isAddMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[10] bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          <i className="fa fa-map-marker mr-2" />
          Cliquez sur la carte pour signaler un problème à cet endroit
        </div>
      )}

      {/* Légende par statut */}
      <div className="hidden sm:block absolute bottom-4 left-4 z-[10] bg-white/95 rounded-lg p-3 text-xs text-gray-900 shadow-lg border border-gray-200">
        <div className="font-medium mb-2 text-gray-700">Légende (statut)</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-gray-600">Actif</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-gray-600">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#22c55e' }} />
            <span className="text-gray-600">Résolu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#94a3b8' }} />
            <span className="text-gray-600">Rejeté</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 z-[10] bg-white/95 rounded-lg p-3 text-xs text-gray-900 shadow-lg border border-gray-200">
        <div className="font-medium mb-1 text-gray-700">Problèmes affichés</div>
        <div className="text-2xl font-bold text-indigo-600">{problemes.length}</div>
      </div>

      {/* Conteneur de la carte MapLibre */}
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ background: '#f8fafc' }}
      />

      {/* Indicateur de chargement */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-[20]">
          <div className="text-gray-700">
            <i className="fa fa-spinner fa-spin mr-2" />Chargement...
          </div>
        </div>
      )}

      {/* Erreur carte */}
      {mapError && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-[20]">
          <div className="text-center p-4">
            <i className="fa fa-exclamation-triangle text-4xl text-red-500 mb-4" />
            <p className="text-red-600">{mapError}</p>
          </div>
        </div>
      )}

      {/* Erreur API */}
      {apiError && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[15] max-w-md">
          <div className="rounded-xl border border-red-200 bg-red-50/95 backdrop-blur px-4 py-3 text-sm text-red-700 shadow-lg flex items-start gap-2">
            <i className="fa fa-exclamation-circle mt-0.5 flex-shrink-0" />
            <div className="flex-1">{apiError}</div>
            <button onClick={() => setApiError(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">
              <i className="fa fa-times" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
