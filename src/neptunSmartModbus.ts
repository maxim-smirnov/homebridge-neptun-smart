import ModbusRTU from 'modbus-serial';
import {throttle} from 'throttle-debounce';
import {ReadRegisterResult, WriteRegisterResult} from 'modbus-serial/ModbusRTU';
import {Config, Register, WiredSensorsStatus, WirelessSenorStatus, WirelessSensorsCount} from './neptunSmartData';

export declare type ConfigWriter = (value: Config) => Promise<Config>;

export class NeptunSmartModbus {

  private client: ModbusRTU | null = null;

  private networkErrors = [
    'ESOCKETTIMEDOUT',
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'ENETRESET',
    'ECONNABORTED',
    'ENETUNREACH',
    'ENOTCONN',
    'ESHUTDOWN',
    'EHOSTDOWN',
    'ENETDOWN',
    'EWOULDBLOCK',
    'EAGAIN',
  ];

  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly address: number,
    private readonly didConnect: () => void,
  ) {
    this.connect();
  }

  private connect() {
    this.client = null;

    const client = new ModbusRTU();
    client.connectTCP(this.host, { port: this.port })
      .then(() => {
        client.setID(this.address);
        client.setTimeout(5000);
        this.client = client;
        this.didConnect();
      })
      .catch((e) => {
        this.checkError(e, true);
      });
  }

  private throttledReconnect = throttle(10000, () => {
    if (this.client !== null && this.client.isOpen) {
      this.client.close(() => {
        this.connect();
      });
    } else {
      this.connect();
    }
  });

  // eslint-disable-next-line
  private checkError(e: any, forceRetry: boolean = false) {
    if((e.message && this.networkErrors.includes(e.message))
      || (e.errno && this.networkErrors.includes(e.errno))
      || forceRetry) {
      this.throttledReconnect();
    }
  }

  private getBit = (value: number, bit: number): number => {
    return (value & (1 << bit)) >> bit;
  };

  async fetchConfig(): Promise<Config> {
    const configNumber = await this.readSingleRegister(Register.Config);
    const config : Config = {
      floorWashMode: !!this.getBit(configNumber, 0), // 0
      alarmFirstGroup: !!this.getBit(configNumber, 1), // 1
      alarmSecondGroup: !!this.getBit(configNumber, 2), // 2
      wirelessSensorsLowBattery: !!this.getBit(configNumber, 3), // 3
      wirelessSensorsConnectionLost: !!this.getBit(configNumber, 4), // 4
      valveCloseOnFirstGroupLostConnection: !!this.getBit(configNumber, 5), // 5
      valveCloseOnSecondGroupLostConnection: !!this.getBit(configNumber, 6), // 6
      paringModeActive: !!this.getBit(configNumber, 7), // 7
      valveOpenFirstGroup: !!this.getBit(configNumber, 8), // 8
      valveOpenSecondGroup: !!this.getBit(configNumber, 9), // 9
      groupsEnabled: !!this.getBit(configNumber, 10), // A
      valveCloseOnLostConnection: !!this.getBit(configNumber, 11), // B
      keyboardLocked: !!this.getBit(configNumber, 12), // C
    };

    return config;
  }

  async fetchWiredSensorsStatus(): Promise<WiredSensorsStatus> {
    const wiredSensorsStatusNumber = await this.readSingleRegister(Register.WiredSensorsStatus);
    const wiredSensorsStatus: WiredSensorsStatus = {
      alarmDetectedLineOne: !!this.getBit(wiredSensorsStatusNumber, 0),
      alarmDetectedLineTwo: !!this.getBit(wiredSensorsStatusNumber, 1),
      alarmDetectedLineThree: !!this.getBit(wiredSensorsStatusNumber, 2),
      alarmDetectedLineFour: !!this.getBit(wiredSensorsStatusNumber, 3),
    };

    return wiredSensorsStatus;
  }

  async fetchWirelessSensorsCount(): Promise<WirelessSensorsCount> {
    const wirelessSensorsCount: WirelessSensorsCount = {
      wirelessSensorsCount: await this.readSingleRegister(Register.WirelessSensorsCount),
    };

    return wirelessSensorsCount;
  }

  async fetchWirelessSensorStatus(i: number): Promise<WirelessSenorStatus> {
    const wirelessSenorStatusNumber = await this.readSingleRegister(Register.WirelessSenorStatus + i);
    const wirelessSensorStatus: WirelessSenorStatus = {
      alarmDetected: !!this.getBit(wirelessSenorStatusNumber, 0),
      connectionLost: !!this.getBit(wirelessSenorStatusNumber, 2),
      batteryLevel: wirelessSenorStatusNumber >> 8,
    };
    return wirelessSensorStatus;
  }

  private async readSingleRegister(register: Register): Promise<number> {
    return this.readHoldingRegisters(register, 1)
      .then((result) => {
        if (result.data.length === 0) {
          throw Error('No result returned.');
        }
        return result.data[0];
      });
  }

  private async readHoldingRegisters(dataAddress: number, length: number): Promise<ReadRegisterResult> {
    if (this.client === null) {
      return Promise.reject(new Error('Disconnected.'));
    }
    return this.client.readHoldingRegisters(dataAddress, length)
      .catch((e) => {
        this.checkError(e);
        throw e;
      });
  }

  public async writeConfigRegister(value: Config): Promise<Config> {
    const modbusValue = +value.floorWashMode +
      (+value.alarmFirstGroup << 1) +
      (+value.alarmSecondGroup << 2) +
      (+value.wirelessSensorsLowBattery << 3) +
      (+value.wirelessSensorsConnectionLost << 4) +
      (+value.valveCloseOnFirstGroupLostConnection << 5) +
      (+value.valveCloseOnSecondGroupLostConnection << 6) +
      (+value.paringModeActive << 7) +
      (+value.valveOpenFirstGroup << 8) +
      (+value.valveOpenSecondGroup << 9) +
      (+value.groupsEnabled << 10) +
      (+value.valveCloseOnLostConnection << 11) +
      (+value.keyboardLocked << 12);
    const configNumber = await this.writeSingleRegister(Register.Config, modbusValue);
    const config : Config = {
      floorWashMode: !!this.getBit(configNumber, 0), // 0
      alarmFirstGroup: !!this.getBit(configNumber, 1), // 1
      alarmSecondGroup: !!this.getBit(configNumber, 2), // 2
      wirelessSensorsLowBattery: !!this.getBit(configNumber, 3), // 3
      wirelessSensorsConnectionLost: !!this.getBit(configNumber, 4), // 4
      valveCloseOnFirstGroupLostConnection: !!this.getBit(configNumber, 5), // 5
      valveCloseOnSecondGroupLostConnection: !!this.getBit(configNumber, 6), // 6
      paringModeActive: !!this.getBit(configNumber, 7), // 7
      valveOpenFirstGroup: !!this.getBit(configNumber, 8), // 8
      valveOpenSecondGroup: !!this.getBit(configNumber, 9), // 9
      groupsEnabled: !!this.getBit(configNumber, 10), // A
      valveCloseOnLostConnection: !!this.getBit(configNumber, 11), // B
      keyboardLocked: !!this.getBit(configNumber, 12), // C
    };
    return config;
  }

  private async writeSingleRegister(register: Register, value: number): Promise<number> {
    return this.writeRegister(register, value)
      .then((result) => {
        if (result.value !== value) {
          throw Error('Setting value failed.');
        }
        return result.value;
      });
  }

  private async writeRegister(dataAddress: number, value: number): Promise<WriteRegisterResult> {
    if (this.client === null) {
      return Promise.reject(new Error('Disconnected.'));
    }
    return this.client.writeRegister(dataAddress, value)
      .catch((e) => {
        this.checkError(e);
        throw e;
      });
  }
}