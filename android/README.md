# EdWorld for Android

Open this directory in Android Studio as an existing Gradle project. Use the bundled JDK, install Android SDK Platform 35 if prompted, and run the `app` configuration on an Android 6.0 or newer device or emulator.

From Windows PowerShell, build a debug APK with `./gradlew.bat :app:assembleDebug`. On macOS or Linux, run `sh gradlew :app:assembleDebug`. Android Studio can also build it from **Build → Build App Bundle(s) / APK(s)**. A Gradle build writes the APK to `app/build/outputs/apk/debug/app-debug.apk`.

The native home screen links to account access, the dashboard, learning and Myra, jobs and internships, hackathons, and applications. These destinations open the production EdWorld website in the Android browser's Custom Tab, with a standard browser fallback. The website handles authentication and stores account data. Changes to the website become available in the app when deployed to production. The app requires connectivity for the workspace.

The app ID is `co.edworld.app`, the same as the Expo prototype. Android requires matching signatures to update an already-installed package with that ID. Use release signing for distribution and preserve the release key for future updates.
