import React, { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getProblemesGeoJSON, getTypesProblemeActifs } from '../../api/problemes.js'
import FormulaireProbleme from './FormulaireProbleme.jsx'

export default function CarteProblemes({ selectedProbleme, onProblemeCreated }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [problemes, setProblemes] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState(null)
  const [isAddMode, setIsAddMode] = useState(false)
  const [newPosition, setNewPosition] = useState(null)
  const [mapError, setMapError] = useState(null)

  // Charger les données
  useEffect(() => {
    loadData()
  }, [filtreStatut])

  // Initialiser la carte MapLibre avec les tuiles offline
  useEffect(() => {
    if (mapRef.current) return

    async function initMap() {
      try {
        // Charger le style local offline
        let style
        try {
          const localResp = await fetch('/styles/madagascar-style.json')
          if (localResp.ok) {
            style = await localResp.json()
          }
        } catch (e) {
          console.warn('Style local non trouvé:', e)
        }

        // Fallback si pas de style local
        if (!style) {
          style = {
            version: 8,
            sources: {
              'osm-raster': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap'
              }
            },
            layers: [{ id: 'osm-raster-layer', type: 'raster', source: 'osm-raster' }]
          }
        }

        mapRef.current = new maplibregl.Map({
          container: mapContainer.current,
          style: style,
          center: [47.5079, -18.8792], // Antananarivo
          zoom: 12,
        })

        mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')

        // Gestion du clic pour ajouter un problème
        mapRef.current.on('click', (e) => {
          if (isAddMode) {
            setNewPosition({ lat: e.lngLat.lat, lng: e.lngLat.lng })
          }
        })

        mapRef.current.on('load', () => {
          console.log('Carte offline chargée')
          setLoading(false)
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

  // Mettre à jour le mode clic
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.getCanvas().style.cursor = isAddMode ? 'crosshair' : ''
  }, [isAddMode])

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

  // Afficher les marqueurs des problèmes
  useEffect(() => {
    if (!mapRef.current) return

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Ajouter les nouveaux marqueurs
    problemes.forEach((feature) => {
      const props = feature.properties
      const coords = feature.geometry.coordinates
      const typeInfo = props.typeProbleme
      const couleur = typeInfo?.couleur || '#FF5733'
      const opacity = props.statut === 'resolu' ? 0.5 : 1

      // Créer l'élément du marqueur
      const el = document.createElement('div')
      el.className = 'probleme-marker'
      el.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: ${couleur};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        opacity: ${opacity};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `
      el.innerHTML = '<i class="fa fa-warning" style="color: white; font-size: 12px;"></i>'

      // Créer le popup
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="min-width: 200px; padding: 8px;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${props.titre}</div>
          ${typeInfo ? `<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: white; background-color: ${typeInfo.couleur}; margin-bottom: 8px;">${typeInfo.nom}</span>` : ''}
          ${props.description ? `<p style="font-size: 13px; color: #475569; margin: 8px 0;">${props.description}</p>` : ''}
          ${props.adresse ? `<p style="font-size: 12px; color: #64748b;"><i class="fa fa-map-marker" style="margin-right: 4px;"></i>${props.adresse}</p>` : ''}
          <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
            Statut: <span style="font-weight: 500;">${props.statut}</span>
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
  }, [problemes])

  async function loadData() {
    setLoading(true)
    try {
      const [geoData, typesData] = await Promise.all([
        getProblemesGeoJSON(filtreStatut),
        getTypesProblemeActifs(),
      ])
      setProblemes(geoData?.features || [])
      setTypes(typesData || [])
    } catch (e) {
      console.error('Erreur chargement données:', e)
    } finally {
      setLoading(false)
    }
  }

  function handleProblemeCreated() {
    setIsAddMode(false)
    setNewPosition(null)
    loadData()
    onProblemeCreated?.()
  }

  return (
    <div className="relative h-[600px] rounded-xl overflow-hidden border border-white/10">
      {/* Contrôles de la carte */}
      <div className="absolute top-4 left-4 z-[10] flex flex-col gap-2">
        <button
          onClick={() => {
            setIsAddMode(!isAddMode)
            setNewPosition(null)
          }}
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
          className="px-3 py-2 rounded-lg bg-slate-800 text-white border border-white/10 text-sm shadow-lg"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="en_cours">En cours</option>
          <option value="resolu">Résolus</option>
        </select>

        <button
          onClick={loadData}
          className="px-3 py-2 rounded-lg bg-slate-800 text-white border border-white/10 text-sm shadow-lg hover:bg-slate-700"
        >
          <i className="fa fa-refresh" />
        </button>
      </div>

      {/* Message mode ajout */}
      {isAddMode && !newPosition && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[10] bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          <i className="fa fa-map-marker mr-2" />
          Cliquez sur la carte pour placer le problème
        </div>
      )}

      {/* Légende */}
      <div className="absolute bottom-4 left-4 z-[10] bg-slate-900/90 rounded-lg p-3 text-xs text-white">
        <div className="font-medium mb-2">Légende</div>
        <div className="space-y-1">
          {types.slice(0, 5).map((type) => (
            <div key={type.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: type.couleur }}
              />
              <span>{type.nom}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {newPosition && (
        <div className="absolute top-4 right-4 z-[10] bg-slate-900 rounded-xl p-4 w-80 max-h-[500px] overflow-y-auto border border-white/10 shadow-xl">
          <h3 className="text-white font-medium mb-3">
            <i className="fa fa-plus-circle mr-2 text-indigo-400" />
            Nouveau problème
          </h3>
          <FormulaireProbleme
            position={newPosition}
            onSuccess={handleProblemeCreated}
            onCancel={() => {
              setNewPosition(null)
              setIsAddMode(false)
            }}
          />
        </div>
      )}

      {/* Stats */}
      {!newPosition && (
        <div className="absolute top-4 right-4 z-[10] bg-slate-900/90 rounded-lg p-3 text-xs text-white">
          <div className="font-medium mb-1">Problèmes affichés</div>
          <div className="text-2xl font-bold text-indigo-400">{problemes.length}</div>
          <div className="text-slate-400 mt-1">Carte offline</div>
        </div>
      )}

      {/* Conteneur de la carte MapLibre */}
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ background: '#0f172a' }}
      />

      {/* Indicateur de chargement */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-[20]">
          <div className="text-white">
            <i className="fa fa-spinner fa-spin mr-2" />Chargement...
          </div>
        </div>
      )}

      {/* Erreur carte */}
      {mapError && (
        <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-[20]">
          <div className="text-center text-white p-4">
            <i className="fa fa-exclamation-triangle text-4xl text-red-400 mb-4" />
            <p className="text-red-300">{mapError}</p>
          </div>
        </div>
      )}
    </div>
  )
}
