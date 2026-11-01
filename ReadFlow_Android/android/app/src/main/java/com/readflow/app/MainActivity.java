package com.readflow.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 全文朗读的分段音频队列在首段用户点击后连续播放，需要放开逐段手势限制
        this.bridge.getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
    }
}
