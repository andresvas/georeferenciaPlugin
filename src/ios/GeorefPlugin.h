#ifndef GeorefPlugin_h
#define GeorefPlugin_h
#import <Cordova/CDVPlugin.h>

@interface GeorefPlugin : CDVPlugin
- (void)INIT_MONITORING_CONTROL:(CDVInvokedUrlCommand*)command;
- (void)OPEN_VISIT_US:(CDVInvokedUrlCommand*)command;

#endif /* GeorefPlugin_h */
@end
