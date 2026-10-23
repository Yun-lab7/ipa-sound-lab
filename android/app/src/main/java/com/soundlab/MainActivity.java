package com.soundlab;

import android.app.Activity;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Locale;

/**
 * The whole app is the same page that runs in a browser, loaded from assets.
 * Two things are added that a WebView does not give for free: audio may start
 * without a tap, and the example words are spoken by Android's own voice,
 * because a bare WebView often has no speech synthesis of its own.
 */
public class MainActivity extends Activity {

    private WebView web;
    private TextToSpeech tts;
    private boolean ttsReady = false;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(Locale.UK);
                ttsReady = true;
            }
        });

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "AndroidTTS");
        web.loadUrl("file:///android_asset/index.html");

        setContentView(web);
    }

    private class Bridge {
        /** Speak a word with the device voice. Returns false if no voice is ready. */
        @JavascriptInterface
        public boolean speak(String text, float rate) {
            if (!ttsReady || tts == null) return false;
            tts.setSpeechRate(rate <= 0 ? 0.85f : rate);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "soundlab");
            return true;
        }

        @JavascriptInterface
        public void stop() {
            if (tts != null) tts.stop();
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
