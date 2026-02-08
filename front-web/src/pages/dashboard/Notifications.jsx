import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../api/notifications'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const userId = localStorage.getItem('auth_userId')

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setError('Utilisateur non connecté')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getNotifications(userId)
      setNotifications(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleMarkAsRead = async (notif) => {
    if (notif.lu) return
    try {
      await markAsRead(notif.id)
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, lu: true } : n))
    } catch (err) {
      console.error('Erreur marquage lu:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!userId) return
    try {
      await markAllAsRead(userId)
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
    } catch (err) {
      console.error('Erreur marquage tout lu:', err)
    }
  }

  const handleOpenNotification = async (notif) => {
    await handleMarkAsRead(notif)
    if (notif.signalement?.id) {
      navigate(`/signalements?highlight=${notif.signalement.id}`)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return date.toLocaleDateString('fr-FR')
  }

  const unreadCount = notifications.filter(n => !n.lu).length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <i className="fa fa-bell"></i>
          Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h1>
        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fa fa-check-double mr-2"></i>
          Tout marquer comme lu
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <i className="fa fa-bell-slash text-6xl mb-4"></i>
          <p className="text-xl">Aucune notification</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleOpenNotification(notif)}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                notif.lu 
                  ? 'bg-white border-gray-200' 
                  : 'bg-blue-50 border-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`text-2xl ${notif.lu ? 'text-gray-400' : 'text-blue-600'}`}>
                  <i className="fa fa-bell"></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${notif.lu ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notif.titre}
                    </h3>
                    {!notif.lu && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-gray-400 text-sm mt-2">
                    <i className="fa fa-clock mr-1"></i>
                    {formatDate(notif.dateCreation)}
                  </p>
                </div>
                {notif.signalement && (
                  <div className="text-blue-600">
                    <i className="fa fa-external-link"></i>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
