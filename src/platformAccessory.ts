import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { ExampleHomebridgePlatform } from './platform';

import {GateData} from './types';

import axios from 'axios';

const deviceActionAPIURL = 'https://deviceaction.zapopen.com/api/EVOhttp/EVOWTMMomentaryActuationRequest';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service;

  private readonly config: GateData;

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.config = accessory.context.device.Config;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Cellgate')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.ModuleType)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.DeviceSerialNumber);

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.GarageDoorOpener) ||
        this.accessory.addService(this.platform.Service.GarageDoorOpener);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.Name);


    // create handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentDoorState)
      .onGet(this.handleCurrentDoorStateGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetDoorState)
      .onGet(this.handleTargetDoorStateGet.bind(this))
      .onSet(this.handleTargetDoorStateSet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.ObstructionDetected)
      .onGet(this.handleObstructionDetectedGet.bind(this));

  }

  async handleTargetDoorStateSet(value: CharacteristicValue) {
    const target = value as number;

    if(target === this.platform.Characteristic.TargetDoorState.OPEN){
      this.platform.log.info('Opening Gate ', this.accessory.context.device.Name);
      //send request
      const data = this.config;

      // Send a POST request
      axios.post(deviceActionAPIURL, data)
        .then(response => {
          this.platform.log.debug('Got response: ', response);
        })
        .catch(error => {
          // Handle errors
          this.platform.log.error('Error:', error.message);
        });
    }
  }

  async handleCurrentDoorStateGet(): Promise<CharacteristicValue> {
    return this.platform.Characteristic.CurrentDoorState.CLOSED;
  }

  async handleTargetDoorStateGet(): Promise<CharacteristicValue> {
    return this.platform.Characteristic.TargetDoorState.CLOSED;
  }

  async handleObstructionDetectedGet(): Promise<CharacteristicValue> {
    return false;
  }

}
