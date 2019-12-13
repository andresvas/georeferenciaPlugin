package com.todo1.plugins;

import android.content.Intent;
import com.intergrupo.bancolombia.bancolombialibrary.Location.MonitoringControl;
import com.intergrupo.bancolombia.bancolombialibrary.Presentation.Map.implementations.MapsActivity;
import java.util.UUID;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

public class GeorefPlugin extends CordovaPlugin {
    private CallbackContext lastCallback;
    private JSONArray lastArgs;
    private MonitoringControl controlMonitoreo;

    public static String getUUID() {
        UUID value = UUID.randomUUID();
        return value.toString();
    }

    private void returnAndKeepCallback(CallbackContext callbackContext) {
        PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
        pr.setKeepCallback(true);
        callbackContext.sendPluginResult(pr);
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        try {
            if (lastCallback != null && !lastCallback.isFinished()) {
                lastCallback.error("Canceled");
            }
            lastCallback = callbackContext;
            lastArgs = args;
            Action ac = Action.fromString(action);
            switch (ac) {
                case OPEN_VISIT_US:
                    Intent intent = new Intent(cordova.getActivity(), MapsActivity.class);
                    cordova.startActivityForResult(this, intent, 0);
                    callbackContext.success();
                    return true;
                case INIT_MONITORING_CONTROL:
                    String tokenId = getUUID() + "|" + getUUID();
                    controlMonitoreo = new MonitoringControl(tokenId, cordova.getActivity());
                    callbackContext.success();
                    return true;
                default:
                    callbackContext.error("Action not implemented");
                    return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
            callbackContext.error(e.getMessage());
            return false;
        }
    }


    public enum Action {
        OPEN_VISIT_US,
        INIT_MONITORING_CONTROL,
        INVALID;


        public static Action fromString(String action) {
            try {
                return Action.valueOf(action);
            } catch (IllegalArgumentException e) {
                return INVALID;
            }
        }
    }

}
