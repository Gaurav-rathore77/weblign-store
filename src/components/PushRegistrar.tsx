import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../hooks/useAuth';
import { registerForPushNotificationsAsync, savePushToken } from '../services/notifications';

export function PushRegistrar() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    registerForPushNotificationsAsync().then((token) => {
      if (mounted && token) {
        savePushToken(user.id, token).catch(() => {});
      }
    });
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {});
    const resp = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.orderId) {
        // navigation handled by app if needed
      }
    });
    return () => {
      sub.remove();
      resp.remove();
    };
  }, []);

  return null;
}
