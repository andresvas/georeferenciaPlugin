/********* GeorefPlugin.m Cordova Plugin Implementation *******/
//
//  GeorefPlugin.h
//
#import <Foundation/Foundation.h>
#import "GeorefPlugin.h"
#import <GoogleMaps/GoogleMaps.h>
#import "Georeferenciacion/MapViewController.h"
#import "Georeferenciacion/Monitoreo.h"

@implementation GeorefPlugin

CDVInvokedUrlCommand * lastCommandCallback;

- (void)INIT_MONITORING_CONTROL:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try{
            /** TODO IMPLEMENT TOKEN? **/
            [[Monitoreo alloc] initWithOtherId:@""];
            [self sendSuccessMessage:@"Monitor Control initialized" andCallbackId:command.callbackId];
        }@catch (NSException *exception) {
            NSLog(@"%@", exception.reason);
            [self sendErrorResult:exception.reason callbackId:command.callbackId];
        }
    }];
}

- (void)OPEN_VISIT_US:(CDVInvokedUrlCommand *)command {
    @try{
        NSString* mapsKey = [self.commandDelegate.settings objectForKey:@"gmaps_api_key"];
        [GMSServices provideAPIKey:mapsKey];
        MapViewController *temp = [[MapViewController alloc]init];
        [self.viewController presentViewController:temp animated:YES completion:nil];

        [self sendSuccessMessage:@"Visit us initialized" andCallbackId:command.callbackId];
    }@catch (NSException *exception) {
        NSLog(@"%@", exception.reason);
        [self sendErrorResult:exception.reason callbackId:command.callbackId];
    }
}

-(void)sendSuccessResult:(NSDictionary *)dictionary callbackId:(NSString *)callbackId {
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:dictionary
                                                       options:0 //NSJSONWritingPrettyPrinted // Pass 0 if you don't care about the readability of the generated string
                                                         error:&error];
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsString:jsonString];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
}

-(void)sendErrorResult:(NSString *)message callbackId:(NSString *)callbackId {
    NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
    [dictionary setObject:message forKey:@"errorMessage"];
    [dictionary setObject:[NSNumber numberWithInt:1] forKey:@"errorCode"];
    [dictionary setObject:[NSNumber numberWithBool:false] forKey:@"success"];
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                      messageAsString:[dictionary description]];

    [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
}

-(void)sendSuccess:(NSString *)callbackId {
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
}

-(void)sendSuccessMessage:(NSString *)message andCallbackId:(NSString *)callbackId {
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:message];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
}

@end
