import { PlatformAccessory, CharacteristicSetCallback } from 'homebridge';

import { NeptunSmartPlatform } from './platform';
import {NeptunSmartModbus, ConfigWriter} from './neptunSmartModbus';
import {Config} from './neptunSmartData';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class NeptunSmart {
  private faucetServices;
  private wiredSensorServices;
  private wirelessSensorServices;
  readonly id;
  readonly displayName;
  private readonly host;
  private readonly port;
  private readonly address;
  private readonly updateInterval;
  private readonly wiredSensorsCount;
  private readonly isGroupsEnabled;
  private currentConfig;

  private neptunSmartModbus: NeptunSmartModbus;

  constructor(
    private readonly platform: NeptunSmartPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly config,
  ) {
    // load all information from context
    this.id = accessory.context.device.id;
    this.displayName = accessory.context.device.displayName;
    this.host = config.host;
    this.port = config.port ?? 503;
    this.address = config.address ?? 240;
    this.wiredSensorsCount = config.wiredSensorsCount;
    this.updateInterval = config.updateInterval ?? 60;
    this.isGroupsEnabled = config.groupsEnabled ?? false;

    this.faucetServices = [];
    this.wiredSensorServices = [];
    this.wirelessSensorServices = [];

    this.platform.log.debug(this.wiredSensorsCount);
    this.neptunSmartModbus = new NeptunSmartModbus(this.host, this.port, this.address, () => {
      this.setUpAfterConnection();
    });

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Neptun')
      .setCharacteristic(this.platform.Characteristic.Model, 'Neptun Smart');

    this.faucetServices.push(this.accessory.getService('Valves group 1') ||
        this.accessory.addService(this.platform.Service.Faucet, 'Valves group 1', 'neptun-valves-group-1'));
    this.faucetServices[0].setCharacteristic(this.platform.Characteristic.Name, 'Valves group 1');
    this.faucetServices[0].getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.handleFaucetFirstGroupActiveSet.bind(this));
    if (this.isGroupsEnabled) {
      this.faucetServices.push(this.accessory.getService('Valves group 2') ||
          this.accessory.addService(this.platform.Service.Faucet, 'Valves group 2', 'neptun-valves-group-1'));
      this.faucetServices[0].setCharacteristic(this.platform.Characteristic.Name, 'Valves group 2');
      this.faucetServices[0].getCharacteristic(this.platform.Characteristic.Active)
        .onSet(this.handleFaucetSecondGroupActiveSet.bind(this));
    }

    for (let i=0; i<this.wiredSensorsCount; ++i) {
      this.wiredSensorServices.push(this.accessory.getService(`Wired sensor ${i+1}`) ||
          this.accessory.addService(this.platform.Service.LeakSensor, `Wired sensor ${i+1}`, `neptun-wired-sensor-${i+1}`));
      this.wiredSensorServices[i].setCharacteristic(this.platform.Characteristic.Name, `Wired sensor ${i+1}`);
    }

    setInterval(() => {
      this.updateFromDevice(platform);
    }, this.updateInterval * 1000);
  }

  private async setUpAfterConnection() {
    try {
      const config = await this.neptunSmartModbus.fetchConfig();
      this.platform.log.debug('Updating config:', config);

      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.SerialNumber, this.id);

      this.platform.log.info('Device with id', this.id, 'discovered successfully');

    } catch (e) {
      if(e instanceof Error) {
        this.platform.log.error('Could obtain device metadata after connection.', e.message);
      }
    }
  }

  private async updateFromDevice(platform: NeptunSmartPlatform) {
    try {
      const config = this.currentConfig = await this.neptunSmartModbus.fetchConfig();
      this.platform.log.debug('Updating with config:', config);

      const c = platform.Characteristic;

      this.faucetServices[0].updateCharacteristic(c.Active, config.valveOpenFirstGroup);
      if (this.isGroupsEnabled) {
        this.faucetServices[1].updateCharacteristic(c.Active, config.valveOpenFirstGroup);
      }

      const wiredSensorsStatus = await this.neptunSmartModbus.fetchWiredSensorsStatus();
      this.platform.log.debug('Updating with wiredSensorsStatus:', wiredSensorsStatus);

      if (this.wiredSensorsCount > 0) {
        if (wiredSensorsStatus.alarmDetectedLineOne) {
          this.wiredSensorServices[0].updateCharacteristic(c.LeakDetected, c.LeakDetected.LEAK_DETECTED);
        } else {
          this.wiredSensorServices[0].updateCharacteristic(c.LeakDetected, c.LeakDetected.LEAK_NOT_DETECTED);
        }
      }

      if (this.wiredSensorsCount > 1) {
        if (wiredSensorsStatus.alarmDetectedLineTwo) {
          this.wiredSensorServices[1].updateCharacteristic(c.LeakDetected, c.LeakDetected.LEAK_DETECTED);
        } else {
          this.wiredSensorServices[1].updateCharacteristic(c.LeakDetected, c.LeakDetected.LEAK_NOT_DETECTED);
        }
      }

      if (this.wiredSensorsCount > 2) {
        if (wiredSensorsStatus.alarmDetectedLineThree) {
          this.wiredSensorServices[2].updateCharacteristic(c.LeakDetected, c.LeakDetected.LEAK_DETECTED);
        } else {
          this.wiredSensorServices[2].updateCharacteristic(c.LeakDetected, c.LeakDetected.LEAK_NOT_DETECTED);
        }
      }

      if (this.wiredSensorsCount > 3) {
        if (wiredSensorsStatus.alarmDetectedLineFour) {
          this.wiredSensorServices[3].updateCharacteristic(c.LeakDetected, c.LeakDetected.LEAK_DETECTED);
        } else {
          this.wiredSensorServices[3].updateCharacteristic(c.LeakDetected, c.LeakDetected.LEAK_NOT_DETECTED);
        }
      }

      const wirelessSensorsCount = await this.neptunSmartModbus.fetchWirelessSensorsCount();
      this.platform.log.debug('Updating with wirelessSensorsCount:', wirelessSensorsCount);

      for (let i=0; i<wirelessSensorsCount.wirelessSensorsCount; ++i) {
        this.wirelessSensorServices.push(this.accessory.getService(`Wireless sensor ${i+1}`) ||
          this.accessory.addService(this.platform.Service.LeakSensor, `Wireless sensor ${i+1}`, `neptun-wireless-sensor-${i+1}`));
        this.wiredSensorServices[i].setCharacteristic(this.platform.Characteristic.Name, `Wireless sensor ${i+1}`);
      }

      for (let i=0; i<wirelessSensorsCount.wirelessSensorsCount; ++i) {
        const wirelessSensorStatus = await this.neptunSmartModbus.fetchWirelessSensorStatus(i);
        this.platform.log.debug('Updating with', i+1, 'wirelessSensorsStatus:', wirelessSensorStatus);
        this.wirelessSensorServices[i].updateCharacteristic(c.LeakDetected, wirelessSensorStatus.alarmDetected ?
          c.LeakDetected.LEAK_DETECTED : c.LeakDetected.LEAK_NOT_DETECTED);
        this.wirelessSensorServices[i].updateCharacteristic(c.StatusFault, wirelessSensorStatus.connectionLost ?
          c.StatusFault.GENERAL_FAULT : c.StatusFault.NO_FAULT);
        this.wirelessSensorServices[i].updateCharacteristic(c.StatusLowBattery, wirelessSensorStatus.batteryLevel < 20 ?
          c.StatusLowBattery.BATTERY_LEVEL_LOW : c.StatusLowBattery.BATTERY_LEVEL_NORMAL);
      }
    } catch (e) {
      if(e instanceof Error) {
        this.platform.log.error('Could not update config and sensors.', e.message);
      }
    }
  }

  private async handleConfigWrite(writer: ConfigWriter, value: Config, name: string, callback: CharacteristicSetCallback):
    Promise<Config | null> {

    this.platform.log.debug(name, 'Updating to to:', value);

    return writer.call(this.neptunSmartModbus, value)
      .then((result) => {
        this.platform.log.debug(name, 'Update ok. Wrote:', result);
        callback(null);
        return result;
      })
      .catch((error) => {
        this.platform.log.debug(name, 'Update failed. Error:', error.message);
        callback(error);
        return null;
      });
  }

  async handleFaucetFirstGroupActiveSet(value) {
    this.currentConfig.valveOpenFirstGroup = !!value;
    if (!this.isGroupsEnabled) {
      this.currentConfig.valveOpenSecondGroup = !!value;
    }
    await this.handleConfigWrite(this.neptunSmartModbus.writeConfigRegister, this.currentConfig, 'Valve group 1 active', () => {
      this.platform.log.debug('Status for valve group 1 set to', this.currentConfig.valveOpenFirstGroup);
    });
  }

  async handleFaucetSecondGroupActiveSet(value) {
    if (!this.isGroupsEnabled) {
      this.currentConfig.valveOpenFirstGroup = !!value;
    }
    this.currentConfig.valveOpenSecondGroup = !!value;
    await this.handleConfigWrite(this.neptunSmartModbus.writeConfigRegister, this.currentConfig, 'Valve group 2 active', () => {
      this.platform.log.debug('Status for valve group 2 set to', this.currentConfig.valveOpenSecondGroup);
    });
  }
}
