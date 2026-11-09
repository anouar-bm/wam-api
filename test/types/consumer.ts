// Type tests: compiled with `tsc -p test/types`, never run.
// Code a plugin or host is expected to write must compile, and each line
// marked @ts-expect-error must be rejected; if the types become too loose,
// that marker is reported as unused and the check fails.
import type {
	WamDescriptor,
	WamEvent,
	WamMidiEvent,
	WamAutomationEvent,
	WamParameterConfiguration,
	WamParameterData,
} from '@webaudiomodules/api';
import { VERSION } from '@webaudiomodules/api';

const version: string = VERSION;

const descriptor: WamDescriptor = {
	identifier: 'com.example.gain',
	name: 'Gain',
	vendor: 'Example',
	version: '1.0.0',
	apiVersion: version,
	thumbnail: '',
	keywords: ['gain'],
	isInstrument: false,
	description: '',
	website: '',
	hasAudioInput: true,
	hasAudioOutput: true,
	hasAutomationInput: true,
	hasAutomationOutput: false,
	hasMidiInput: false,
	hasMidiOutput: false,
	hasMpeInput: false,
	hasMpeOutput: false,
	hasOscInput: false,
	hasOscOutput: false,
	hasSysexInput: false,
	hasSysexOutput: false,
};

// @ts-expect-error a descriptor must declare every has*Input/Output flag
const incomplete: WamDescriptor = { ...descriptor, hasSysexOutput: undefined };

const gain: WamParameterConfiguration = { label: 'Gain', type: 'float', defaultValue: 0.5, minValue: 0, maxValue: 1 };
// @ts-expect-error parameter type is one of float | int | boolean | choice
const badType: WamParameterConfiguration = { type: 'double' };

const automation: WamAutomationEvent = { type: 'wam-automation', time: 0.5, data: { id: 'gain', value: 0.25, normalized: false } };
const midi: WamMidiEvent = { type: 'wam-midi', data: { bytes: [0x90, 60, 100] } };
// @ts-expect-error MIDI data is exactly three bytes
const longMidi: WamMidiEvent = { type: 'wam-midi', data: { bytes: [0x90, 60, 100, 0] } };
// @ts-expect-error automation data needs id, value and normalized
const badAutomation: WamAutomationEvent = { type: 'wam-automation', data: { value: 1 } };

/** Hosts narrow events by their `type`; each branch must see the matching data. */
function describe(event: WamEvent): string {
	switch (event.type) {
		case 'wam-midi': {
			const [status, note] = event.data.bytes;
			return `midi ${status} ${note}`;
		}
		case 'wam-automation': {
			const data: WamParameterData = event.data;
			return `automation ${data.id}=${data.value}`;
		}
		default:
			return event.type;
	}
}

export { descriptor, incomplete, gain, badType, automation, midi, longMidi, badAutomation, describe };
