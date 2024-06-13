<template>
    <div class="Sync h-100 flex-h">
        <div class="flex-1 flex-v left">
            <div class="Label">选择课本(*.bin)</div>
            <input type="file" ref="File" @change="onChange_File" />
            <div class="Label">课本名称</div>
            <input type="text" v-model="mBook.name" />
            <div class="Label">出版社</div>
            <input type="text" v-model="mBook.press" />
            <VueDraggable class="Items w-100 flex-1 scroll-y" v-model="mBook.words" group="words">
                <div class="Item flex-h middle" v-for="(item,index) in mBook.words" :key="item.id">
                    <div class="Index">{{(index+1)}}.</div>
                    <div class="Name flex-1">{{item.word}}</div>
                    <div class="Id">ID:{{item.id}}</div>
                    <div class="Delete button" @click.stop="handleDelete(item,index)">删除</div>
                </div>
            </VueDraggable>
            <div class="flex-h left">
                <button @click="clearWords">清空单词</button>
                <button @click="exportBook">导出课本</button>
                <button :disabled="!connected" @click="syncBook">同步课本</button>
            </div>
        </div>
        <div class="Line"></div>
        <div class="List flex-1 flex-v left">
            <div class="Label">搜索单词</div>
            <input type="text" v-model="mKeyword" />
            <VueDraggable class="Items w-100 flex-1 scroll-y" v-model="mWords" :sort="false"
                :group="{ name: 'words', pull: 'clone', put: false }"
                filter=".Undraggable">
                <div class="Item flex-v" v-for="(item,index) in mWords" :key="item.id"
                    :class="[mBook.words.some(o=>o.id==item.id)&&'Undraggable']">
                    <div class="flex-h">
                        <div class="Name flex-1">{{item.word}}</div>
                        <div class="Id">ID:{{item.id}}</div>
                    </div>
                    <div class="Explain">{{item.explain}}</div>
                </div>
            </VueDraggable>
            <div class="flex-h left">
                <button @click="batchAdd">批量添加</button>
            </div>
            <div v-if="mBatchAdd.show" class="BatchAdd" @click.stop="{}">
                <div class="Content wh-100 flex-v">
                    <div class="Title">批量添加 每行一个单词</div>
                    <textarea class="Input flex-1" v-model="mBatchAdd.text"></textarea>
                    <button @click="batchAdd_Run">添加</button>
                    <div class="Close button" @click="batchAdd_Close">关闭</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { items as words } from "@/tool/word";
import { l, p, h, g, v, e, y, a, } from "@/tool/DCK";
import { VueDraggable } from 'vue-draggable-plus'

const encode = (str: string) => {
    return new TextEncoder().encode(str);
}

const uint8ArrayToBinaryFile = (uint8Array: Uint8Array, fileName: string) => {
    var blob = new Blob([uint8Array], { type: 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

@Component({
    components: {
        VueDraggable,
    }
})
export default class Sync extends Vue {
    $refs!: {
        File: HTMLInputElement
    }

    @Prop() readonly print!: (obj: any) => void;
    @Prop() readonly connected!: boolean;

    currentTask = { count: 5, mode: 1 };

    mBook = {
        name: "",
        press: "",
        words: [
        ] as any[],
    }
    mKeyword = "";

    mWords: any[] = [];
    mBatchAdd = {
        show: false,
        text: "",
    }

    onChange_File(e) {
        let file = e.target.files?.[0];
        if (!file) {
            return;
        }
        this.analysis();
    }

    @Watch("mKeyword")
    onChange_Keyword(value: string) {
        let keyword = value.trim();
        if (!keyword) {
            this.mWords = [];
            return;
        }
        keyword = keyword.toLowerCase();
        this.mWords = words.filter(o => o.word.toLowerCase().includes(keyword)).slice(0, 100);
    }

    @Watch("mBatchAdd.show")
    onChange_BatchAddShow(value: boolean) {
        if (!value) {
            this.mBatchAdd.text = "";
        }
    }

    mounted() {
    }

    setLearningTasks() {
        y.setLearningTasks(this.currentTask, (e) => this.getLearningTasks());
    }
    getLearningTasks() {
        y.getLearningTasks((e) => {
            this.print(e);
            a("log", "at pages/set-task/set-task.vue:215", e);
            console.log("同步成功");
        });
    }


    analysis() {
        let file = this.$refs.File.files?.[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target!.result as ArrayBuffer;
            let block = 32;
            let a = new Uint8Array(data.slice(4 * block, 4 * block + 1))[0];
            let b = new Uint8Array(data.slice(6 * block + 5, 6 * block + 6))[0];
            if (a != 0x01 || b != 0x01) {
                alert("导入文件有误");
                return;
            }
            this.mBook.name = l.bufferString(data.slice(8, 8 + block)) + "";
            this.mBook.press = l.bufferString(data.slice(72, 72 + block)) + "";
            // console.log(l.bufferString(data.slice(6 * length, 6 * length + length * 2)));
            let count = new Uint16Array(data.slice(6 * block + 13, 6 * block + 15))[0];
            let wordStart = 9 * block;
            let wordNameLength = 2 * block;
            let wordIdStart = wordStart + wordNameLength + 6;
            let wordIdLength = 8;
            let wordLength = 3 * block;
            let items: any[] = [];
            for (let i = 0; i < count; i++) {
                let offset = wordLength * i;
                items.push({
                    word: (l.bufferString(data.slice(offset + wordStart, offset + wordStart + wordNameLength)) + "").split(":")[1],
                    id: (l.bufferString(data.slice(offset + wordIdStart, offset + wordIdStart + wordIdLength)) + "").split(":")[1],
                })
            }
            this.mBook.words = items;
        };
        reader.readAsArrayBuffer(file);
    }

    syncBook() {
        let upload = (array) => {
            let t = !0;
            y.upload(1, array, (e) => {
                this.print(e);
                "success" == e.status && t && ((t = !1), this.setLearningTasks());
            });
        }
        // let file = this.$refs.File.files?.[0];
        // if (file) {
        //     const reader = new FileReader();
        //     reader.onload = (event) => {
        //         const arrayBuffer = event.target!.result;
        //         upload(arrayBuffer);
        //     };
        //     reader.readAsArrayBuffer(file);
        //     return;
        // }
        let book = this.createBook();
        if (book) {
            upload(book.data);
        }
    }

    createBook() {
        let book = this.mBook;
        if (!book.name || !book.press || !book.words.length) {
            return null;
        }
        let block = 32;
        let wordStart = 9 * block;
        let wordNameLength = 2 * block;
        let wordIdStart = wordStart + wordNameLength + 5;
        let wordIdLength = 11;
        let wordLength = 3 * block;
        let data = new Uint8Array(wordStart + book.words.length * wordLength);
        let bookId = 0x07;
        data[0] = bookId;
        data[3 * block + 24] = bookId;
        data[4 * block] = 0x01;
        data.set(encode(book.name), 8);
        data.set(encode(book.press), 72);
        data.set(encode("unit:"), 6 * block);
        data[6 * block + 5] = 0x01;
        let count = new Uint16Array(1);
        count[0] = book.words.length;
        data.set(new Uint8Array(count.buffer, count.byteOffset, count.byteLength), 6 * block + 13);
        data.set(encode("总单元"), 6 * block + 15);
        for (let i = 0; i < book.words.length; i++) {
            const word = book.words[i];
            let offset = wordLength * i;
            data.set(encode("word:" + word.word), offset + wordStart);
            data.set(encode("id:" + word.id), offset + wordIdStart);
            data[offset + wordStart + block * 2 + 16] = 0x01;
            data[offset + wordStart + block * 2 + 17] = 0x01;
            data[offset + wordStart + block * 2 + 21] = 0x01;
        }
        return { data, name: book.name };
    }

    exportBook() {
        let book = this.createBook();
        if (!book) {
            return;
        }
        uint8ArrayToBinaryFile(book.data, book.name + ".bin");
    }

    handleDelete(item, index) {
        this.mBook.words.splice(index, 1);
    }

    clearWords() {
        this.mBook.words = [];
    }

    batchAdd() {
        this.mBatchAdd.show = true;
    }

    batchAdd_Run() {
        let items = this.mBatchAdd.text.trim().split("\n");
        items.forEach(item => {
            let str = item.trim();
            let word = words.find(o => o.word == str);
            if (!word) {
                return;
            }
            if (this.mBook.words.some(o => o.id == word!.id)) {
                return;
            }
            this.mBook.words.push(word);
        });
        this.mBatchAdd.show = false;
    }

    batchAdd_Close() {
        this.mBatchAdd.show = false;
    }
}
</script>

<style lang="scss" scoped>
.Sync {
    .Line {
        margin: 10px;
        width: 1px;
        background: rgba($color: #000000, $alpha: 0.1);
    }
    .Label {
        color: rgba($color: #000000, $alpha: 0.5);
        margin-top: 10px;
        font-size: 12px;
    }
    .Items {
        padding: 20px 0;
        .Item {
            background: rgba($color: white, $alpha: 1);
            border-radius: 5px;
            padding: 16px;
            cursor: move;
            & + .Item {
                margin-top: 10px;
            }
            &.Undraggable {
                cursor: no-drop;
            }
            .Index {
                font-size: 12px;
                color: rgba($color: #000000, $alpha: 0.3);
                margin-right: 5px;
            }
            .Id {
                font-size: 12px;
                color: rgba($color: #000000, $alpha: 0.3);
            }
            .Name {
                font-size: 16px;
                font-weight: bold;
            }
            .Explain {
                font-size: 14px;
                margin-top: 5px;
            }
            .Delete {
                color: red;
                font-size: 12px;
                margin-left: 20px;
            }
        }
    }
    .List {
        position: relative;
        .BatchAdd {
            background: rgba($color: #000000, $alpha: 0.5);
            position: absolute;
            left: -10px;
            top: -10px;
            right: -10px;
            bottom: -10px;
            border-radius: 10px;
            .Content {
                padding: 30px;
                .Title {
                    font-size: 20px;
                    color: white;
                }
                .Input {
                    margin: 20px 0;
                }
            }
            .Close {
                position: absolute;
                right: 30px;
                top: 20px;
                color: white;
            }
        }
    }
}
</style>