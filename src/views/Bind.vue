<template>
    <div class="Bind flex-v left">
        <button v-if="!mConnected" @click="handleTest">连接</button>
        <template v-if="mConnected">
            <button @click="disconnect">取消连接</button>
            <button @click="bindDevice">绑定设备</button>
            <button @click="getSystemInfo">获取系统信息</button>
            <button @click="getDeviceStatus">获取设备信息</button>
            <!-- <div class="flex-h">
                <van-field v-model="mBookId" type="digit" label="课本ID" />
                <van-button @click="syncBook">同步课本ID</van-button>
            </div> -->
        </template>
        <div class="Info flex-v">
            <div class="Item flex-h" v-for="(item,index) in mInfo" :key="index">
                <div class="Label">{{item.label}}</div>
                <div class="Value">{{item.value}}</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { l, p, h, g, v, e, y, a, callback, setCharacteristic } from "@/tool/DCK";
@Component
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
            console.log(device);
            this.connect(device);
        }).catch((err) => {
            console.log(err);

        })
        // navigator.bluetooth.requestLEScan({

        // }).then((res) => {
        //     console.log(res);

        // }).catch((err) => {
        //     console.log(err);

        // })
    }

    connect(device: BluetoothDevice) {
        device.addEventListener("gattserverdisconnected", () => {
            this.mConnected = false;
            this.mCharacteristic = null as any;
        })
        device.gatt?.connect().then((server) => {
            console.log(server);
            this.getPrimaryService(server);
        }).catch(err => {
            console.log(err);
        });
    }

    getPrimaryService(server: BluetoothRemoteGATTServer) {
        server.getPrimaryService('0000ae3a-0000-1000-8000-00805f9b34fb').then((service) => {
            console.log(service);
            setTimeout(() => {
                service.getCharacteristic('0000ae3c-0000-1000-8000-00805f9b34fb').then((characteristic) => {
                    console.log("0000ae3c", characteristic);
                    characteristic.startNotifications().then(() => {
                        console.log("startNotifications");
                    }).catch((err) => {
                        console.log(err);
                    }).finally(() => {
                        this.getCharacteristic(service);
                    });
                    characteristic.addEventListener("characteristicvaluechanged", (item: any) => {
                        console.log(item);
                        let data = item.currentTarget.value.buffer;
                        callback(data);
                    })
                }).catch(err => {
                    console.log(err);
                });
            }, 500);
        }).catch(err => {
            console.log(err);
        });
    }

    getCharacteristic(service: BluetoothRemoteGATTService) {//0000ae3c-0000-1000-8000-00805f9b34fb
        service.getCharacteristic('0000ae3b-0000-1000-8000-00805f9b34fb').then((characteristic) => {
            console.log(characteristic);
            this.mCharacteristic = characteristic;
            setCharacteristic(characteristic);
            this.mConnected = true;
        }).catch(err => {
            console.log(err);
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
            console.log(data);
            this.print(data);
        })
    }

    getSystemInfo() {
        y.getSystemInfo((data) => {
            console.log(data);
            this.print(data);
        })
    }

    currentTask = { count: 5, mode: 1 };

    setLearningTasks() {
        y.setLearningTasks(this.currentTask, (e) => this.getLearningTasks());
    }
    getLearningTasks() {
        y.getLearningTasks((e) => {
            a("log", "at pages/set-task/set-task.vue:215", e);
            console.log("同步成功");
        });
    }

    syncBook() {
        let e = this.mBookId;
        let t = !0;
        a("log", "at pages/set-task/set-task.vue:240", "同步课本ID" + e);
        y.upload(1, e, (e) => {
            console.log(e);

            "success" == e.status && t && ((t = !1), this.setLearningTasks());
        });
    }

    print(data: any) {
        if (!data) {
            this.mInfo = [];
            return;
        }
        this.mInfo = Object.keys(data).map(o => ({ label: o, value: data[o] }));
    }
}
</script>

<style lang="scss" scoped>
.Bind {
    padding: 20px;
    & > * {
        & + * {
            margin-top: 20px;
        }
    }
    .Info {
        .Item {
            .Label {
                min-width: 150px;
            }
            .Value {
            }
        }
    }
}
</style>