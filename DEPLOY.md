# Deploy CHU-NI-JI-A

1. Upload every file in this folder to the root of the GitHub Pages repository.
2. Replace the existing `index.html` and `admin.html`.
3. Keep the image files beside `index.html`.
4. Review `firestore.rules.example`, insert the real admin UID or use an existing secure admin-claim rule, then publish the updated Firestore rules.
5. Confirm that the allowed order sizes are only `S`, `M`, and `L`.
6. Open `https://chunijia.tech/` in a private window after GitHub Pages finishes deploying.
7. Hard-refresh with `Ctrl + F5` and submit one test order.
8. Open `https://chunijia.tech/admin.html` and confirm the order appears.

The storefront submits orders at 79 TND, free delivery, cash on delivery only.
