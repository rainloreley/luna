import {ipcRenderer} from "electron";
import {elements} from "music-metadata/lib/matroska/MatroskaDtd";


class LunaboardController {
    private DEV_INTERFACE = "/dev/tty.usbserial-A50603C4";
    elements: LunaboardElement[] = [];

    startListener = () => {
        ipcRenderer.on("board::incoming-data", (event, args) => {
            /*
        message format:
        xx-yy_zz
        x: Identifier
        y: Function
        z: Value
         */
            const _separatedInfos = args.split("_");
            const _reference = _separatedInfos[0];
            const _identifier = _reference.split("-")[0];
            const _elementById = this.elements.find((e) => e.identifier === _identifier);
            if (_elementById !== undefined) {
                _elementById.eventHandler(args);
            }
        })
    }
}

class LunaboardElement {

    public identifier: string;
    eventHandler: (message: string) => void;

    constructor(identifier: string) {
        this.identifier = identifier;
    }
}

class LunaboardClickableRotaryEncoder extends LunaboardElement {

    buttonCallbackChannel: string;
    rotationCallbackChannel: string;

    currentRotationValue: number = 0;

    constructor(identifier: string, buttonCallbackChannel: string, rotationCallbackChannel: string) {
        super(identifier);
        this.buttonCallbackChannel = buttonCallbackChannel;
        this.rotationCallbackChannel = rotationCallbackChannel;
    }

    public eventHandler = (message: string) => {
        const _separatedInfos = message.split("_");
        const _recipient = _separatedInfos[0];
        const _function = _recipient.split("-")[1];
        const value = parseInt(_separatedInfos[1]);

        // button press handler
        if (_function == "btn") {
            ipcRenderer.send("board::re1-btn-relay", value == 1);
        }
        else if (_function == "pos") {
            const _direction: RotaryEncoderDirection = value > this.currentRotationValue ? RotaryEncoderDirection.up : RotaryEncoderDirection.down;
            this.currentRotationValue = value;
            ipcRenderer.send("board::re1-pos-relay", _direction);
        }
    }

}

enum RotaryEncoderDirection {
    down, up
}

class LunaboardSlider extends LunaboardElement {
    private static MIN = 0
    public static MAX = 1024

    currentValue: number = 0;

    callbackChannel: string

    constructor(identifier: string, callbackChannel: string) {
        super(identifier);
        this.callbackChannel = callbackChannel;
    }

    public eventHandler = (message: string) => {
        const _separatedInfos = message.split("_");
        const _recipient = _separatedInfos[0];
        const _function = _recipient.split("-")[1];
        const value = parseInt(_separatedInfos[1]);
        this.currentValue = value;

        ipcRenderer.send(this.callbackChannel, value);
    }
}

export {LunaboardElement, LunaboardSlider, LunaboardClickableRotaryEncoder, RotaryEncoderDirection};
export default LunaboardController;