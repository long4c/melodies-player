# Firebase setup

Saved melodies use Firebase Authentication and Cloud Firestore so the same Google account can save on mobile and listen later on another device.

1. Create a Firebase project.
2. Add a Web app and copy its config values into `.env` using `.env.example` as the template.
3. Enable Authentication > Google sign-in provider.
4. Create a Firestore database.
5. Add Firestore rules:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/melodies/{melodyId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Restart the dev server after changing `.env`.
