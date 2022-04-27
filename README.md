
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>


# Homebridge Nuptun Smart

This plugin provides an integration with Neptun Smart leak prevention system.
No online API. Control your sensors and valves via local network using ModBus RTU.


## Example Config

Using a terminal, navigate to the project folder and run this command to install the development dependencies:

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