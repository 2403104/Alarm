// Eye Care Timer Service Worker

self.addEventListener("install", (event) => {
  // Activate immediately so notifications are ready
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  const action = event.action;
  event.notification.close();

  if (action === "stop-alarm") {
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) {
            // Post a message to the first client (active tab)
            clientList[0].postMessage({ type: "STOP_ALARM" });
            return clientList[0].focus();
          }
          // If no clients are open, try to open the app
          return self.clients.openWindow("./");
        })
    );
  } else {
    // Default click focuses the client
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return self.clients.openWindow("./");
      })
    );
  }
});


