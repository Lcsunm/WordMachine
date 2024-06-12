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
                <button @click="createBook">导出课本</button>
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

const words_test = [
    { "explain": "n. 调节；条件作用；整修；训练，健身训练\"\n\"v. 以…为条件", "id": 22313, "sentence": "Some experts thought that children's personality was the result of conditioning from parents.", "sentence_explain": "一些专家认为孩子的个性是父母熏陶的结果。", "us_bs": "kYnÈdjYnjŋ", "us_word_sound_local": "22313.mp3", "word": "conditioning" },
    { "explain": "n. 读者人数；读者们；读者的身份", "id": 22314, "sentence": "The magazine has a readership of over 300,000.", "sentence_explain": "这本杂志的读者超过了30万人。", "us_bs": "ÈriÐdYrjp", "us_word_sound_local": "22314.mp3", "word": "readership" },
    { "explain": "adj. 可转让的；[数] 可转移的", "id": 22315, "sentence": "Think carefully before you buy it, because this ticket is not transferable.", "sentence_explain": "这张票是不可转让的，所以你要想清楚再买。", "us_bs": "trænsÈf\ÐrYb(Y)l", "us_word_sound_local": "22315.mp3", "word": "transferable" },
    { "explain": "n. 时间生物学；生物钟学", "id": 22316, "sentence": "The Research Methods in Exercise Chronobiology ⅰ: The Experiment Techniques   ", "sentence_explain": "运动时间生物学研究方法&实验技术", "us_bs": "ÌkrQnobajÈQlYdi", "us_word_sound_local": "22316.mp3", "word": "chronobiology" },
    { "explain": "v. 下；将从支架上移开；取出\"\n\"n. 下法，完成", "id": 22317, "sentence": "Lucy dismounted and went straight to the hospital.", "sentence_explain": "露西下了车，直接去了医院。", "us_bs": "djsÈmant", "us_word_sound_local": "22317.mp3", "word": "dismount" },
    { "explain": "n. 高峰；小尖塔；尖峰；极点\"\n\"vt. 造小尖塔；置于尖顶上；置于高处", "id": 22318, "sentence": "He reached the pinnacle of academic achievement after publishing an article in a top journal.", "sentence_explain": "在顶级杂志上发表文章后，他达到了学术成就的顶峰。", "us_bs": "ÈpjnYk(Y)l", "us_word_sound_local": "22318.mp3", "word": "pinnacle" },
    { "explain": "n. 否定性；消极性", "id": 22319, "sentence": "Often a patient cannot snap out of their negativity that easily.   ", "sentence_explain": "病人常常不能那么容易就打消掉消极的情绪", "us_bs": "ÌneaYÈtjvYti", "us_word_sound_local": "22319.mp3", "word": "negativity" },
];

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
        data[0] = 0x31;
        data[3 * block + 24] = 0x31;
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