<template>
    <div class="Bind wh-100 flex-h">
        <div class="Layout flex-v left">
            <button v-if="!mConnected" @click="handleTest">连接</button>
            <template v-if="mConnected">
                <button @click="disconnect">取消连接</button>
                <button @click="bindDevice">激活设备</button>
                <button @click="getSystemInfo">获取系统信息</button>
                <button @click="getDeviceStatus">获取设备信息</button>
            </template>
            <div class="Info flex-v">
                <div class="Item flex-v" v-for="(item,index) in mInfo" :key="index">
                    <div class="Label">{{item.label}}</div>
                    <div class="Value">{{item.value}}</div>
                </div>
            </div>
        </div>
        <div class="Line"></div>
        <Sync class="flex-1" :connected="mConnected" :print="print"></Sync>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { l, p, h, g, v, e, y, a, callback, setCharacteristic } from "@/tool/DCK";
// import XLSX from "xlsx";
import Sync from "@/components/Sync.vue";

export const OpenSource = "开源地址:https://github.com/Lcsunm/WordMachine";

@Component({
    components: {
        Sync,
    }
})
export default class Bind extends Vue {

    mCharacteristic!: BluetoothRemoteGATTCharacteristic;
    mConnected = false;
    mBookId = 49;

    mInfo: { label: string, value: string }[] = [];


    @Watch("mConnected")
    onChange_Connected(value) {
        if (!value) {
            this.print(null);
        }
    }

    mounted() {

    }


    handleTest() {
        navigator.bluetooth.requestDevice({
            // acceptAllDevices:true,
            filters: [{
                namePrefix: "YZW-DCK-",//Vh4L70ne3qEgSjukrnEngw=="
            }],
            optionalServices: [
                "0000ae3a-0000-1000-8000-00805f9b34fb",
                "0000ae3b-0000-1000-8000-00805f9b34fb",
                "0000ae3c-0000-1000-8000-00805f9b34fb",
            ],
        }).then((device) => {
            this.log(device);
            this.connect(device);
        }).catch((err) => {
            this.log(err);
        })
    }

    connect(device: BluetoothDevice) {
        device.addEventListener("gattserverdisconnected", () => {
            this.mConnected = false;
            this.mCharacteristic = null as any;
        })
        device.gatt?.connect().then((server) => {
            this.log(server);
            this.getPrimaryService(server);
        }).catch(err => {
            this.log(err);
        });
    }

    getPrimaryService(server: BluetoothRemoteGATTServer) {
        server.getPrimaryService('0000ae3a-0000-1000-8000-00805f9b34fb').then((service) => {
            this.log(service);
            setTimeout(() => {
                service.getCharacteristic('0000ae3c-0000-1000-8000-00805f9b34fb').then((characteristic) => {
                    this.log(characteristic);
                    characteristic.startNotifications().then(() => {
                        this.log("startNotifications");
                    }).catch((err) => {
                        this.log(err);
                    }).finally(() => {
                        this.getCharacteristic(service);
                    });
                    characteristic.addEventListener("characteristicvaluechanged", (item: any) => {
                        // this.log(item);
                        let data = item.currentTarget.value.buffer;
                        callback(data);
                    })
                }).catch(err => {
                    this.log(err);
                });
            }, 500);
        }).catch(err => {
            this.log(err);
        });
    }

    getCharacteristic(service: BluetoothRemoteGATTService) {//0000ae3c-0000-1000-8000-00805f9b34fb
        service.getCharacteristic('0000ae3b-0000-1000-8000-00805f9b34fb').then((characteristic) => {
            this.log(characteristic);
            this.mCharacteristic = characteristic;
            setCharacteristic(characteristic);
            this.mConnected = true;
        }).catch(err => {
            this.log(err);
        });
    }

    disconnect() {
        if (this.mCharacteristic) {
            // this.mCharacteristic.stopNotifications().then(() => {
            //     console.log("stopNotifications");
            // }).catch((err) => {
            //     console.log(err);
            // });
            this.mCharacteristic.service.device.gatt?.disconnect();
            this.mCharacteristic = null as any;
        }
        this.mConnected = false;
    }

    bindDevice() {
        y.bindDevice(() => {

        })
    }

    getDeviceStatus() {
        y.getDeviceStatus((data) => {
            // console.log(data);
            this.print(data);
        })
    }

    getSystemInfo() {
        y.getSystemInfo((data) => {
            // console.log(data);
            this.print(data);
        })
    }

    print(data: any) {
        if (!data) {
            this.mInfo = [];
            return;
        }
        this.mInfo = Object.keys(data).map(o => ({ label: o, value: data[o] }));
    }

    log(data: any) {
        console.log(data);
        
        this.print({
            obj: data,
        });
    }
}
</script>

<style lang="scss" scoped>
.Bind {
    padding: 20px;
    .Layout {
        & > * {
            & + * {
                margin-top: 20px;
            }
        }
        width: 200px;
    }
    .Line {
        margin: 10px;
        width: 1px;
        background: rgba($color: #000000, $alpha: 0.1);
    }
    .Info {
        .Item {
            .Label {
                font-size: 12px;
                color: rgba($color: #000000, $alpha: 0.3);
            }
            .Value {
                word-break: break-all;
            }
        }
    }
}
</style>