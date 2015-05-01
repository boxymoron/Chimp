package com.boxymoron.phonegap;

import org.apache.cordova.CordovaActivity;
import org.apache.cordova.R;

import android.os.Bundle;

public class ChimpActivity extends CordovaActivity {
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //setContentView(R.layout.main);//this is the original
        super.setStringProperty("loadingDialog", "Wait, loading chimP");
        super.setTitle("Bubbles (chimPology)");
        super.setStringProperty("errorUrl", "file:///android_asset/www/error.html");
        
        super.init();
        //super.appView.clearCache(true);
        super.setIntegerProperty("splashscreen", R.drawable.splash); // load splash.jpg image from the resource drawable directory
        super.loadUrl("file:///android_asset/www/index.html", 2000);

    }
}