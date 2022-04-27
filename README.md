
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>


# Homebridge Nuptun Smart

This plugin provides an integration with Neptun Smart leak prevention system.
No online API. Control your sensors and valves via local network using ModBus RTU.

## Instructions

1. Connect your Neptun Smart appliance to Wi-Fi network.
2. Discover device IP address and make static DHCP lease settings.
3. Install plugin and configure it using [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x). 
4. Minimum required settings are: `id`, `displayName`, `host`, `groupsEnabled`, `wiredSensorsCount`.

### Wireless sensors will be discovered automatically.

## Example Config

If you are not using [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x) feel free to use this example config.

```json
{
  "platforms": [
    {
      "devices" : [
        {
          "id" : "neptun-1",
          "displayName" : "Neptun Smart Bath",
          "host" : "192.168.1.30",
          "groupsEnabled" : false,
          "wiredSensorsCount" : 3
        },
        {
          "id" : "neptun-2",
          "displayName" : "Neptun Smart Shower",
          "host" : "192.168.1.31",
          "port" : 503,
          "address": 240,
          "groupsEnabled" : false,
          "wiredSensorsCount" : 4,
          "updateInterval" : 10,
        }
      ],
      "platform" : "NeptunSmart"
    }
  ]
}
```