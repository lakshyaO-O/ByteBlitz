# Capacitor WebView - keep JavaScript bridge interfaces
-keepclassmembers class com.getcapacitor.BridgeWebViewClient { *; }
-keepclassmembers class com.getcapacitor.BridgeWebChromeClient { *; }
-keepclassmembers class com.getcapacitor.JSExport { *; }
-keepclassmembers class com.getcapacitor.Bridge { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin { *; }

# Keep Capacitor plugin bridge methods
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
}

# Keep native methods for all plugins
-keep class com.getcapacitor.** { *; }
-keep class com.codezarena.app.MainActivity { *; }

# Prevent obfuscation of WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep annotations used by Capacitor
-keepattributes *Annotation*, JavascriptInterface

# Keep source info for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
