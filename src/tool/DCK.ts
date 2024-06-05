export const l = {
    string2buffer: function (e) {
        return new Uint8Array(
            e.match(/[\da-f]{2}/gi).map(function (e) {
                return parseInt(e, 16);
            })
        ).buffer;
    },
    ab2hex: (e) =>
        Array.prototype.map
            .call(new Uint8Array(e), function (e) {
                return ("00" + e.toString(16)).slice(-2);
            })
            .join(""),
    bufferString: function (e) {
        return this.hexCharCodeToStr(this.ab2hex(e));
    },
    hexCharCodeToStr: function (e) {
        if (e.length % 2 != 0) return console.log("必须为偶数");
        let t: any = [];
        for (let o = 0; o < e.length; o += 2) {
            let s = e.substring(o, o + 2);
            if ("ff" == s || "00" == s) continue;
            let a = parseInt(s, 16);
            0 != a && t.push(a);
        }
        return this.readUTF(t);
    },
    readUTF: function (e) {
        if ("string" == typeof e) return e;
        let t = "",
            o = e;
        for (let s = 0; s < o.length; s++) {
            let e = o[s].toString(2),
                a = e.match(/^1+?(?=0)/);
            if (a && 8 == e.length) {
                let e = a[0].length,
                    i = o[s].toString(2).slice(7 - e);
                for (let t = 1; t < e; t++) i += o[t + s].toString(2).slice(2);
                (t += String.fromCharCode(parseInt(i, 2))), (s += e - 1);
            } else t += String.fromCharCode(o[s]);
        }
        return t;
    },
    hexReversal(e, x?: any) {
        let t: any = [];
        for (let o = 0; o < e.length; o += 2) t.push(e.slice(o, o + 2));
        return t.reverse().join("");
    },
    appendBuffer(e, t) {
        var o = new Uint8Array(e.byteLength + t.byteLength);
        return o.set(new Uint8Array(e), 0), o.set(new Uint8Array(t), e.byteLength), o;
    },
};

export const g = "0000AE3A-0000-1000-8000-00805F9B34FB",
    v = "0000AE3B-0000-1000-8000-00805F9B34FB",
    h = "";
export const e = (data) => {
    u(data);
}
export const a = (...args: any[]) => {
    console.log(...args);

}
let u = (e) => { };
let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

export let callback = (data: any) => {
    u(data);
};

export const setCharacteristic = (a) => {
    characteristic = a;
}

export const p = {
    write(e, t, o, s, i = (e) => { }) {
        (u = i);
        if (!characteristic) {
            return;
        }
        characteristic.writeValue(s).then((res) => {
            console.log(true);
        }).catch(err => {
            console.log(err);
        });
    }
}

export const y = {
    bindDevice(e) {
        var t = new Uint8Array([89, 90, 87, 16, 7, 0, 0, 255]);
        p.write(h, g, v, t.buffer, (t) => {
            this.getPacket(t, (t) => {
                e({ status: this.getStatus(t) });
            });
        });
    },
    setLearningTasks(e, t) {
        let o = t;
        var s = new Uint8Array([89, 90, 87, 16, 6, 4, 0, 255, e.count, e.mode, 1, 1]);
        p.write(h, g, v, s.buffer, o);
    },
    getLearningTasks(e) {
        var t = new Uint8Array([89, 90, 87, 32, 22, 0, 0, 255]);
        p.write(h, g, v, t.buffer, (t) => {
            this.getPacket(t, (t) => {
                t = t.substring(16);
                let o = parseInt(this.getString(t, 0, 0), 16),
                    s = parseInt(this.getString(t, 1, 1), 16),
                    a = parseInt(this.getString(t, 2, 2), 16),
                    i = parseInt(this.getString(t, 3, 3), 16),
                    n = this.getString(t, 4, 5);
                (n = l.hexReversal(n)), (n = parseInt(n, 16)), e({ status: !0, data: { count: o, mode: s, example: a, phrase: i, learnNumber: n } });
            });
        });
    },
    getLearningInfo(e) {
        var t = new Uint8Array([89, 90, 87, 16, 8, 0, 0, 255]);
        p.write(h, g, v, t.buffer, (t) => {
            this.getPacket(t, (t) => {
                "6f6b" == (t = t.substring(16)) ? this._getLearningInfoData(e) : e({ status: !1 });
            });
        });
    },
    getMyBookInde(e) {
        var t = new Uint8Array([89, 90, 87, 16, 11, 0, 0, 255]);
        p.write(h, g, v, t.buffer, (t) => {
            this.getPacket(t, (t) => {
                t = t.substring(16);
                let o = this.getString(t, 0, 1);
                (o = l.hexReversal(o)), (o = parseInt(o, 16)), e({ status: !0, data: { learnNumber: o } });
            });
        });
    },
    _getLearningInfoData(e, t = "") {
        var o = new Uint8Array([89, 90, 87, 16, 9, 0, 0, 255]);
        p.write(h, g, v, o.buffer, (o) => {
            this.getPacket(o, (o) => {
                if ("6f6b" != (o = o.substring(16))) (t += o), this._getLearningInfoData(e, t);
                else {
                    var s: any = [];
                    for (let e = 0; e < t.length; e += 12) {
                        let o = t.slice(e, e + 12),
                            a = this.getString(o, 0, 0),
                            i = this.getString(o, 1, 4);
                        i = l.hexReversal(i);
                        let n = this.getString(o, 5, 5);
                        s.push({ type: parseInt(a, 16), time: parseInt(i, 16), count: parseInt(n, 16) });
                    }
                    e(s);
                }
            });
        });
    },
    getSystemInfo(e) {
        var t = new Uint8Array([89, 90, 87, 16, 5, 0, 0, 255]);
        p.write(h, g, v, t.buffer, (t) => {
            this.getPacket(t, (t) => {
                t = t.substring(16);
                let o = this.getString(t, 0, 6);
                o = l.hexCharCodeToStr(o);
                let s = this.getString(t, 7, 9);
                s = l.hexCharCodeToStr(s);
                let a = this.getString(t, 10, 24),
                    i = "";
                for (let e = 0; e < a.length; e += 2) {
                    let t = a.slice(e, e + 2);
                    i += parseInt(t, 16).toString();
                }
                a = s + i;
                let n = this.getString(t, 25, 35),
                    r = "";
                for (let e = 0; e < n.length; e += 4) r += n.slice(e, e + 2);
                n = r;
                let c = this.getString(t, 36, 40);
                c = l.hexCharCodeToStr(c);
                let d = this.getString(t, 41, 41),
                    u = this.getString(t, 42, 73);
                (u = l.hexCharCodeToStr(u)), e({ deviceType: o, deviceNo: a, deviceMac: n, deviceVersion: c, deviceActivated: d, deviceName: u });
            });
        });
    },
    getDeviceStatus(e) {
        a("log", "at utils/commandUtil.js:324", "获取设备信息");
        var t = new Uint8Array([89, 90, 87, 16, 4, 0, 0, 255]);
        p.write(h, g, v, t.buffer, (t) => {
            this.getPacket(t, (t) => {
                t = t.substring(16);
                let o = this.getString(t, 0, 1);
                (o = l.hexReversal(o, 16)), (o = parseInt(o, 16));
                let s = this.getString(t, 2, 2);
                s = parseInt(s, 16);
                let a = this.getString(t, 3, 3);
                a = parseInt(a, 16);
                let i = this.getString(t, 4, 9);
                i = l.hexCharCodeToStr(i);
                let n = this.getString(t, 10, 18),
                    r = this.getString(t, 19, 51);
                r = l.hexCharCodeToStr(r);
                let c = this.getString(t, 52, 84);
                c = l.hexCharCodeToStr(c);
                let d = this.getString(t, 85, 93);
                (d = l.hexReversal(d)), (d = parseInt(d, 16)), e({ power: o, chargeStatus: s, learnStatus: a, version: i, clientId: n, bookName: r, press: c, bookId: d });
            });
        });
    },
    upload(e, t, o) {
        let s = t.byteLength,
            a = 0;
        var i = new Date().getTime(),
            n = new Uint8Array([89, 90, 87, 16, 1, 0, 0, e]);
        let r = (c) => {
            let d: any = l.ab2hex(c);
            if ((d.substr(8, 2), (d = d.substr(16)), (d = l.hexCharCodeToStr(d)), "ok" == d)) this.sendCom(t, 0, s, 116, e, i, o), (a = 0);
            else {
                if ((a++, a >= 5)) return void console.log("操作失败");
                p.write(h, g, v, n.buffer, r);
            }
        };
        p.write(h, g, v, n.buffer, r);
    },
    sendCom(e, t, o, s, a, i, n) {
        let r = (100 * -(o / e.byteLength - 1)).toFixed(2);
        "100.00" == r && (r = "100");
        let c,
            d,
            u: any = { status: "sync", progress: r };
        if (o > s) (c = e.slice(t, t + s)), (d = new Uint8Array([89, 90, 87, 16, 2, c.byteLength, 0, a])), (d = l.appendBuffer(d.buffer, c));
        else if (o > 0) (c = e.slice(t, t + o)), (d = new Uint8Array([89, 90, 87, 16, 2, c.byteLength, 0, a])), (d = l.appendBuffer(d.buffer, c));
        else {
            d = new Uint8Array([89, 90, 87, 16, 3, 0, 0, a]);
            var m = new Date().getTime();
            u = { status: "success", progress: r, size: e.byteLength / 1e3 + "kb", time: m - i + "ms" };
        }
        p.write(h, g, v, d.buffer, () => {
            o > s ? ((t += s), (o -= s)) : ((t += o), (o -= o)), this.sendCom(e, t, o, s, a, i, n);
        }),
            n(u);
    },
    getPacket(e, t) {
        var w = 0,
            k = "";
        if ("595a57" == (e = l.ab2hex(e)).substr(0, 6)) {
            let t = e.substr(10, 4);
            (t = l.hexReversal(t)), (k = ""), (w = parseInt(t, 16));
        }
        ((k += e).length - 16) / 2 == w && t(k);
    },
    getString: (e, t, o) => e.substring(2 * t, 2 * o + 2),
    getStatus: (e) => ((e = e.substr(16)), "ok" == (e = l.hexCharCodeToStr(e)) || "OK" == e),
}