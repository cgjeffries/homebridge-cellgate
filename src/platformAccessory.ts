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

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    On: false,
    Brightness: 100,
  };

  private config: GateData;

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

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.exampleStates.On = value as boolean;

    this.platform.log.debug('Set Characteristic On ->', value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const isOn = this.exampleStates.On;

    this.platform.log.debug('Get Characteristic On ->', isOn);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  async setBrightness(value: CharacteristicValue) {
    // implement your own code to set the brightness
    this.exampleStates.Brightness = value as number;

    this.platform.log.debug('Set Characteristic Brightness -> ', value);
  }

  async handleTargetDoorStateSet(value: CharacteristicValue) {
    const target = value as number;

    if(target === this.platform.Characteristic.TargetDoorState.OPEN){
      this.platform.log.debug('Opening Gate ', this.accessory.context.device.Name);
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
