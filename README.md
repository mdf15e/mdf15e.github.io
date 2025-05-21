# HOW TO USE IT

**Last edited**: 2025-05-21
**Edited by**: Harumichi Yamamoto

---

## このリポジトリについて

このリポジトリはGithub Pagesを用いて公開するHPのために作られたテンプレートです。このリポジトリをコピーしてHP作成にぜひご利用ください。

## 注意

このファイル内では `{{kamo}}` のように `{{` `}}` で囲むことで変数を表す。詳しくは [#htmlについて](#htmlについて) 内の「html内の変数」を参照。

## チュートリアル

### pageを作成してみよう

ユーザーが操作するのは基本的に以下のものです。

```
/ja: このディレクトリの中に公開するファイルを保存していきます。
/en: 英語版はこっちに保存します。
```

試しに1つページを作ってみましょう。以下のファイルを探してください。

```
/templates/
    content.html
    page.html <- これ
```

この`/templates`ディレクトリの中にはテンプレートが入っているので、これをコピペして作るようにしましょう。では`page.html`を`/ja`の中にコピーしてください。`/ja`は以下のようになりましたか？

```
/ja/examples
    examples.html
    index.html
    page.html <- 追加された
```

では`page.html`の名前を`about.html`に変更しましょう。（名前は何でも構いません）

```
/ja/examples
    examples.html
    index.html
    about.html <- 名前を変更した
```

では`about.html`を開いてみましょう。

```html
<main>
<h2>
    <!-- page title -->
</h2>
<!-- sentences -->
<div class="box">
    <h3 class="box-title"><!-- some title --></h3>
    <hr>
    <!-- some texts -->
</div>
</main>
```

中央部分はこんな感じになっていますね。基本的に編集するのはこの`<main>`と`</main>`に囲まれている部分です。`<!-- page title -->`の部分を「About」と書き換えましょう。（Aboutでなくても構いません。以下同様）

```html
<h2>
    About <- 書き換えた
</h2>
```

これがこのページのタイトルになります。`<!-- sentences -->`の部分も書き換えましょう。

```html
<h2>
    About
</h2>
私は金木犀が好きです。 <- 書き換えた
```

ここがあなたがメインで文章を書いていく場所になります。もし文章を四角で囲みたくなったら、以下を使ってみましょう。

```html
<div class="box">
    <h3 class="box-title"><!-- some title --></h3>
    <hr>
    <!-- some texts -->
</div>
```

`<!-- some title -->`がタイトル、`<!-- some texts -->`が文章を書く場所になります。

```html
<div class="box">
    <h3 class="box-title">秋の定義</h3>
    <hr>
    金木犀の香りの閉包を秋と呼ぶ。
</div>
```

こうすると文章とタイトルが枠で囲まれ、タイトルが装飾されます。

ページ上部の帯の部分（ナビゲーションと言います）にAboutがないのが気になりますね。`/includes`ディレクトリ内の`header.html`を開いてみましょう。

```
/includes/
    content-summary.html
    footer.html
    head-en.html
    head-ja.html
    header.html <- これ
```

開いてみるとこんな感じ：

```html
<nav id="site-nav">
    <ul>
        <li class="with-light-icon nav-item"><a href="/{{lang}}/index.html">Home</a></li>
        <li class="with-light-icon nav-item"><a href="/{{lang}}/examples.html">Examples</a></li>
    </ul>
</nav>
```

ここがナビゲーションの部分です。ここにAboutを書き加えましょう。

```html
<nav id="site-nav">
    <ul>
        <li class="with-light-icon nav-item"><a href="/{{lang}}/index.html">Home</a></li>
        <li class="with-light-icon nav-item"><a href="/{{lang}}/about.html">About</a></li> <- 書き加えた
        <li class="with-light-icon nav-item"><a href="/{{lang}}/examples.html">Examples</a></li>
    </ul>
</nav>
```

`/{{lang}}/`のあとはファイル名を記述します。これでナビゲーションにAboutが追加されました。このようにナビゲーションに追加するページを**page**と呼びます。

---

### contentを作成してみよう

このホームページテンプレートでは**page**の他に、もう一種類の**content**というページを用意しています。contentは例えば日記を書く際に用いることができます。日記は一日一日の日記からなる記事群です。

一日の日記を作成し、それを一覧で表示できるとよさそうですが、contentを用いるとそれを実現できます。一日の日記をcontentで作成し、それの一覧を表示するpageを作成できます。

具体的にやってみましょう。すでに`example`というcontentがあるので参考にしてください。（必要なくなったら消去して大丈夫です）

#### content typeを新規作成する

まず`diary`という新しいcontentの種類（**content type**と言います）を作成します。そのために1つのファイルを編集、2つのファイル、2つのディレクトリを作成します。

まず`/data`ディレクトリ内の`config.json`を編集します。

```
/data/
    contents_list/
    config.json <- これ
    settings.json
```

`config.json`内の`contentTypes`の項目に`diary`を追加します。

```json
"contentTypes": {
    "example": {"ja": "例", "en": "examples"}, <- ,を追加した
    "diary": {"ja": "日記", "en": "diaries"} <- 追加した
},
```

前の項目の最後に`,`を追加するのを忘れないように注意してください。`ja`, `en`それぞれの後には各言語でのcontentの名前を記入します。ナビゲーションなどにも表示されるので英語は**複数形推奨**です。

続いて`/data/contents_list`ディレクトリ内に`diaries.json`（content typeの複数形）というファイルを作成します。

これはpageでdiaryを一覧表示するためのものです。contentを作成した際に、その情報をここに追加します。`contents_list`ディレクトリ内の`examples.json`の中身を`diaries`にコピーアンドペーストして凡例を書いておきましょう。

次に`/ja`の中に`/template`内の`page.html`をコピーアンドペーストして`diaries.html`（content typeの複数形）という名前でpageを作成します。

このpageはdiaryの一覧を表示するためのものです。必要なら`/en`の中にもコピペして作成しましょう。

```
/ja/examples
    diaries.html <- 作成した
    examples.html
    index.html
```

ではこのpageを編集しましょう。

`body`の`data-tags`属性に`diaries-list`（content typeの複数形-list）を追加し、`id="diaries-list"`（content typeの複数形-list）を付した`div`を記入します。

```html
<body data-tags="diaries-list">
<main>
<div id="diaries-list"></div>
</main>
</body>
```

`data-tags="diaries-list"`でdiaryの一覧用のpageであることを伝えます。
`id="diaries-list"`の`div`の位置に一覧が表示されます。

最後に`/ja`の中にdiaryを保存するための`diaries`というディレクトリを作成しましょう。

```
/ja/diaries <- 作成した
    examples
    diaries.html
    examples.html
    index.html
```

必要なら`/en`の中にも同様に作成しましょう。これで`diary`というcontent typeの作成が完了しました。

#### contentの作成

diaryを作成してみましょう。
`/template`ディレクトリ内にある`content.html`を`/ja/diaries`の中にコピペして`diary1.html`（名前は何でも良い）を作成しましょう。

```
/ja/diaries/diary1.html <- 作成した
```

`diary1.html`を開いて編集してみましょう。基本的に`<main>`と`</main>`で囲まれた内側を編集します。
`<!-- content title -->`と書いてある部分をタイトルに置き換えます。
`<!-- content texts -->`と書いてある部分を日記の中身に書き換えます。

```html
<main>
<div class="content">
    <h3 class="content-title">2014年10月</h3> <- 書き換えた
    <hr>
    <div class="content-text">
        金木犀の香りが少しずつし始めている。 <- 書き換えた
    </div>
</div>
</main>
```

必要なら英語版を`/en/diaries`の中にも同様に作成しましょう。この時日本語版とファイル名は統一してください。

完成したら記事の情報を`/data/contents_list`内の`diaries.json`に書き込みましょう。

```json
{
    "filename": "diary1.html",  <- ファイル名
    "lang": ["ja"],             <- 英語版もあるなら["ja", "en"]
    "created": "2014-10-02",    <- 作成日
    "updated": "2014-10-03",    <- 更新日
    "tags": {
        "ja": ["金木犀"],         <- 日本語でのタグを記入
        "en": ["osmanthus"]      <- 英語でのタグを記入
    }
}
```

これで作成は完了です。

## 設計思想

保守性を意識して作成した。静的サイトでビルダーなしでできることを頑張ってやってみた。

基本的に変更が想定されるものは `config.json` の編集（と悔しながら `update.py` の実行）によって対応できるようにした。また、変更箇所を明確にするために次のように整理している：

* 基本的な変更 → `/data/config.json`（テーマカラー、SNSリンクなど）
* 外観の複雑な変更 → `/css/style.css`
* 内部機構の変更 → `/js/main.js`, `utils.js`
* HTMLファイルの追加・編集 → `/{{lang}}`, `/includes`

また、JSでHTMLやCSSの記述をしないようにし、編集時にどこを見れば良いかを分かりやすくした。さらに、`<body>` の `data-tags` 属性を活用することで、HTMLや外部ライブラリを特定の種類のページに自動で読み込めるようにした。

---

## ディレクトリ構造

* `/css`: CSS用

  * `style.css`: CSSファイルはこれのみ

* `/data`: JSが参照するファイル用

  * `/contents_list`: コンテンツを一覧表示する際に参照するファイル用
  * `config.json`: ユーザーが変更できる設定を格納
  * `settings.json`: ユーザーが変更すべきでない設定を格納

* `/images`: 画像用

  * `/icons`: サイトアイコンやSNSアイコン用

* `/includes`: JSが読み込んで使用するHTMLファイル用

* `/js`: JS用

* `/locales`: 翻訳用

* `index.html`: ルートにアクセスしたときにリダイレクトするためのHTMLファイル

* `README.md`: この説明書。愛情がこもっている

* `update.py`: `<head>` を変更する際に実行

* `/{{lang}}`: 言語ごとのHTMLファイル保管ディレクトリ

  * `/{{contentTypeS}}`: コンテンツのHTMLファイルを保管するディレクトリ

---

## 初期設定

* `index.html`: root にアクセスしたときのリダイレクト先を記述（デフォルトは `/ja/index.html`）
* 必要なページ・コンテンツタイプを[更新の仕方](#更新の仕方)を参考に作成
* スマホ対応の調整：

  * `/css/style.css` の media query にある `@media(max-width=kamo)` の `kamo` の数値を調整
  * 言語切替ボタンやナビゲーションの配置変更に関わる

---

## HTMLについて

### script の読み込み

* 各ページの `<head>` に記述
* よく使うスクリプトは `<body>` に `data-src` 属性として追加可能

  * `/data/config.json` の `scripts` に以下を記述：

    * `url`: スクリプトのURL
    * `defer`: `true` で `defer` 属性付加
    * `loadToAllPages`: 全ページに読み込む場合 `true`
    * `tags`: `<body>` の `data-tags` 属性で指定するタグ
  * `tags` に指定したタグを `<body>` の `data-scr` 属性に空白区切りで記述すると読み込まれる
  * また、スクリプト名を小文字で記述しても読み込まれる

### HTML内の変数

* `{{変数名}}` の形式で記述
* `config` の値をドット記法で参照
* 他ファイルは `{{path:dot-notation}}` 形式で記述
* 予約変数：`{{lang}}`, `{{langLabel}}`, `{{altLang}}`, `{{altLangLabel}}`
* `{{#kamo}}` と書くことで変換を抑制

### 数式

* `<body>` の `data-tags` に `mathjax` を追加でMathJax有効
* インライン： `\(` `\)`、ディスプレイ： `\[` `\]`
* デリミタは `/data/config.json` の `mathjax` で設定可能。ただし `$` は非推奨

### `<head>` の変更

* SEO系metaタグや `main.js` の読み込みは各HTMLに記述
* 一括変更は `/includes/head-ja.html`, `head-en.html` を編集し `update.py` を実行
* `update.py` の使い方：

  ```sh
  python update.py <lang>
  ```
* `<!-- KEY:kamo -->` と `<!-- ENDKEY -->` の間をテンプレートで置換

### テキストの装飾

* 特定のクラス（`first-letter`, `initials`）で文字装飾を制御
* `main.js` の `afterLoadDOM` 内の関数で自動付加

### 各要素の管理状況

* `<head>`: `main.js` の `addToHead`
* `<script>`: `config.json` の `scripts` にて
* `<header>`: `/includes/header.html` を `main.js` の `loadHTMLPartials` で挿入（HTMLに記述があればそちら優先）
* `<footer>`: 同上
* 背景画像: `<header>` 内に `id="bg-image"` の `<div>`

### HTMLの自動読込

* 特定タグを持つHTMLに自動挿入可
* `/includes` 内に挿入HTMLを作成
* `/data/config.json` の `htmlPartials` に以下を設定：

  * `url`: HTMLファイルへのパス
  * `loadToAllPages`: 全ページで読み込むか
  * `target`: 挿入基準の要素（CSSセレクター）
  * `position`: 挿入位置（`beforestart`, `afterstart`, `beforeend`, `afterend`）
  * `tags`: `<body>` の `data-tags` 属性に記述

---

## 更新の仕方

### 記事の種類

* `page` と `content` の2種類

#### page

* `/{{lang}}` 内の `index.html` など
* `site-nav`（ページ上部のナビゲーション）に表示される

#### content

* `/{{lang}}/{{contentTypeS}}` 内のページ
* `contentType` という種類を持つ
* `/{{lang}}/{{contentTypeS}}.html` に一覧で表示される

### page の作成・編集

1. `/{{lang}}` 内のHTMLファイルを作成・編集
2. 他言語版も必要なら作成
3. `/includes/header.html` にリンクを記述
4. テンプレート説明：

   * すべて `<main>` 内に記述
   * `h2` 要素でページタイトル
   * 背景付きにする場合：

     * 全体を `div.box` で囲む
     * 子要素に `h3.box-title` を記述（自動装飾）
     * 直後に `<hr>`、その後本文
   * 一覧表示には `<body>` に `data-tags="{{contentTypeS}}-list"` を追加、`id="{{contentTypeS}}-list"` の `<div>` を設置（中身は空でOK）
   * 一覧ページの表示件数とイントロ長： `/data/config.json` の `contentSummary.itemsPerPage`, `introLength` で設定

### content の作成・編集

* `contentType` = 種類、`contentTypeS` = 複数形

1. `/{{lang}}/{{contentTypeS}}` 内にHTMLを作成・編集
2. 他言語版も必要なら作成
3. 新規なら `/data/contents_list/{{contentTypeS}}.json` に記事情報を追加
4. 既存記事の更新時も日時などを編集
5. テンプレート説明：

   * すべて `<main>` 内に記述
   * `<body>` に `data-tags="content"`
   * 全体を `div.content` で囲む
   * タイトル： `h3.content-title`
   * 本文： `div.content-text`（最初の150文字が一覧のイントロ）
   * `box`, `box-title` も使用可能

### contentType の新規作成

1. `/data/config.json` の `contentTypes` に項目追加

   * `ja`: 日本語表記
   * `en`: 英語表記（複数形推奨）
2. `/data/contents_list` に `{{contentTypeS}}.json` を作成
3. `/{{lang}}` に `{{contentTypeS}}.html` を作成

   * `<body>` に `data-tags="{{contentTypeS}}-list"`
   * `id="{{contentTypeS}}-list"` の `<div>` を記述
4. 表示件数とイントロ長：`/data/config.json` の `contentSummary.itemsPerPage`, `introLength` で設定

---

## デザイン

### テーマカラー

* `/data/config.json` の `colors.theme` に `colorBook` のキーを記述で変更可
* `colorBook` にカスタム項目追加も可能

### 文字装飾

* `h1`, `h2`: 単語の頭文字に `.initials`
* `h3`: 最初の1文字に `.first-letter`
* デザイン変更：それぞれのCSSを編集
* 装飾対象を変える場合：`main.js` の `afterLoadingDOM` 内の `wrapInitials`, `wrapFirstLetter` を編集
