var Service, Characteristic;
var mqtt    = require('mqtt');

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory("homebridge-mqtt-motionsensor", "mqtt-motionsensor", MotionSensorAccessory);
}

function MotionSensorAccessory(log, config) {

	this.log = log;

	this.name = config["name"];
	this.url = config['url'];
	this.topic = config['topic'];
	this.sn = config['sn'] || 'Unknown';

	this.client_Id 		= 'mqttjs_' + config['clientid'] || Math.random().toString(16).substr(2, 8);

	this.options = {
		keepalive: 10,
		clientId: this.client_Id,
		protocolId: 'MQTT',
		protocolVersion: 4,
		clean: true,
		reconnectPeriod: 1000,
		connectTimeout: 30 * 1000,
		will: {
			topic: 'WillMsg',
			payload: 'Connection Closed abnormally..!',
			qos: 0,
			retain: false
		},
		username: config["username"],
		password: config["password"],
		rejectUnauthorized: false
	};

	this.service = new Service.MotionSensor();
	this.client  = mqtt.connect(this.url, this.options);

	var self = this;

	this.client.subscribe(this.topic);
 
	this.client.on('message', function (topic, message) {
		data = JSON.parse(message);
		if (data === null) return null;
		self.value = Boolean(parseInt(data,10));
		self.service.getCharacteristic(Characteristic.MotionDetected).setValue(self.value);
	});

}

MotionSensorAccessory.prototype.getState = function(callback) {
		this.log(this.name, " - MQTT : ", this.value);
		callback(null, this.value);
}

MotionSensorAccessory.prototype.getServices = function() {

	var informationService = new Service.AccessoryInformation();

	informationService
		.setCharacteristic(Characteristic.Name, this.name)
		.setCharacteristic(Characteristic.Manufacturer, "heisice")
		.setCharacteristic(Characteristic.Model, "Motion Sensor")
		.setCharacteristic(Characteristic.SerialNumber, this.sn);

	return [informationService, this.service];
}

