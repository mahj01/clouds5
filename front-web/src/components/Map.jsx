"use client"

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function Map() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mapRef.current) return;

    let cancelled = false;

    async function init() {
      try {
        console.log('Fetching style from local fallback');
        // prefer a local style file we generate from TileJSON vector_layers
        let style;
        try {
          const localResp = await fetch('/styles/madagascar-style.json');
          if (localResp.ok) {
            style = await localResp.json();
          } else {
            console.warn('Local style not found, falling back to tileserver TileJSON');
          }
        } catch (e) {
          console.warn('Local style fetch failed, falling back to tileserver TileJSON', e);
        }

        if (!style) {
          const resp = await fetch('http://localhost:8080/data/v3.json');
          style = await resp.json();
        }

        // Some tile servers embed an invalid center (length 3). Remove it if malformed.
        if (style.center && (!Array.isArray(style.center) || style.center.length !== 2)) {
          console.warn('Removing invalid style.center from style:', style.center);
          delete style.center;
        }

        // If the fetched JSON is a TileJSON (has tiles but no layers), construct a minimal
        // raster style so MapLibre can render without a full Mapbox Style object.
        let styleToUse = style;
        if (!style.layers) {
          if (Array.isArray(style.tiles) && style.tiles.length > 0) {
            const tileUrl = style.tiles[0];
            const looksLikeVector = /\.pbf|vector|{type=vector}|tiles\/v3/i.test(tileUrl);
            if (looksLikeVector) {
              console.error('Fetched TileJSON looks like vector tiles and has no "layers". Cannot auto-create vector layers without a "source-layer" name.');
              setError('Style missing "layers" and appears to be vector TileJSON. Provide a Mapbox-style JSON with layers or include source-layer names.');
              return;
            }

            // build raster fallback style
            console.warn('Constructing raster fallback style from TileJSON tiles:', tileUrl);
            styleToUse = {
              version: 8,
              sources: {
                fallback: {
                  type: 'raster',
                  tiles: style.tiles,
                  tileSize: style.tileSize || 256,
                },
              },
              layers: [
                {
                  id: 'fallback-raster',
                  type: 'raster',
                  source: 'fallback',
                },
              ],
            };
          } else {
            console.error('Style JSON missing required "layers" and no "tiles" to build a fallback.');
            setError('Style JSON missing "layers" and no "tiles" found to create a fallback style.');
            return;
          }
        }

        if (cancelled) return;

        console.log('Initializing map, container=', mapContainer.current);
        mapRef.current = new maplibregl.Map({
          container: mapContainer.current,
          style: styleToUse,
          center: [47.5079, -18.8792], // Antananarivo (lng, lat)
          zoom: 12,
        });

        mapRef.current.on('error', (e) => {
          console.error('maplibre error event', e);
          setError(e && e.error ? String(e.error) : String(e));
        });

        mapRef.current.on('load', () => {
          console.log('map loaded');
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
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", position: 'relative' }}>
      <div
        ref={mapContainer}
        style={{ width: "100%", height: "100%", background: '#0f172a' }}
      />
      {error && (
        <div style={{position: 'absolute', top: 12, left: 12, padding: 8, background: 'rgba(220,38,38,0.9)', color: 'white', borderRadius: 6, zIndex: 999}}>
          Map error: {error}
        </div>
      )}
    </div>
  );
}
