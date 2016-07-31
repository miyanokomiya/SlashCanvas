/*!
 * SlashCanvas
 * v1.0.0 (c) 2016 miyanokomiya.tokyo
 * license MIT
 */
define(function(require) {
	var $ = require("jquery");
	var Matter = require("matter");

	var canvasUtil = require("slashCanvas/common/canvasUtil");
	var matterUtil = require("slashCanvas/common/matterUtil");
	var geoUtil = require("slashCanvas/common/geoUtil");
	var Sound = require("slashCanvas/common/Sound");

	var Engine = Matter.Engine,
		Gui = Matter.Gui,
		World = Matter.World,
		Bodies = Matter.Bodies,
		Body = Matter.Body,
		Composite = Matter.Composite,
		Composites = Matter.Composites,
		Common = Matter.Common,
		Constraint = Matter.Constraint,
		RenderPixi = Matter.RenderPixi,
		Events = Matter.Events,
		Bounds = Matter.Bounds,
		Vector = Matter.Vector,
		Vertices = Matter.Vertices,
		MouseConstraint = Matter.MouseConstraint;

	/**
	 * アプリ本体
	 * @class App
	 * @namespace slashCanvas
	 * @constructor
	 * @param rootId {string} ルートとするDOMのid
	 * @param option {} オプションオブジェクト
	 */
	var Constructor = function(rootId, option) {
		/**
		 * ルートとするDOMのid
		 * @property rootId
		 * @type {string}
		 */
		this.rootId = rootId;

		/**
		 * キャンバスDOM
		 * @property canvas
		 * @type {}
		 * @default null
		 */
		this.canvas = null;

		/**
		 * キャンバスの描画要素
		 * @property ctx
		 * @type {}
		 * @default null
		 */
		this.ctx = null;

		/**
		 * matterエンジン
		 * @property engine
		 * @type {}
		 * @default null
		 */
		this.engine = null;

		/**
		 * ブロックリスト
		 * @property blockList
		 * @type {[]}
		 * @default []
		 */
		this.blockList = [];

		/**
		 * ロード完了後の画像
		 * @property loadedImage
		 * @type {string[]}
		 * @default null
		 */
		this.loadedImage = null;

		/**
		 * スラッシュラインリスト<br>
		 * オブジェクト{s : 始点, e : 終点, life : 残り生存時間}の配列
		 * @property slashLineList
		 * @type {[]}
		 * @default []
		 */
		this.slashLineList = [];

		//
		// オプション要素
		//

		if (!option) {
			option = {};
		}

		/**
		 * 画像ソース
		 * @property image
		 * @type {string}
		 * @default null
		 */
		this.image = option.image || null;

		/**
		 * 幅
		 * @property width
		 * @type {number}
		 * @default 400
		 */
		this.width = option.width || 400;

		/**
		 * 高さ
		 * @property height
		 * @type {number}
		 * @default 400
		 */
		this.height = option.height || 400;

		/**
		 * フィールドに対するブロックのスケール
		 * @property blockScale
		 * @type {number}
		 * @default 0.5
		 */
		this.blockScale = option.blockScale || 0.5;

		/**
		 * x軸重力
		 * @property gravityX
		 * @type {number}
		 * @default 0
		 */
		this.gravityX = !isNaN(option.gravityX) ? option.gravityX : 0;

		/**
		 * y軸重力
		 * @property gravityY
		 * @type {number}
		 * @default 0
		 */
		this.gravityY = !isNaN(option.gravityY) ? option.gravityY : 0;

		/**
		 * サウンド
		 * @property sound
		 * @type {slashCanvas.common.Sound}
		 * @default null
		 */
		this.sound = option.sound ? new Sound(option.sound) : null;

		this.init();
	};

	/**
	 * 初期化
	 * @method init
	 */
	Constructor.prototype.init = function() {
		var self = this;

		if (this.image) {
			// 画像指定の場合はロード
			var img = new Image();
			img.onload = function(e) {
				// ロード完了
				self.loadedImage = img;

				self.initWorld();
			};
			img.src = this.image;
		} else {
			this.initWorld();
		}
	};

	/**
	 * 物理世界の初期化
	 * @method initWorld
	 */
	Constructor.prototype.initWorld = function() {
		var self = this;

		// オプション
		var options = {
			render : {
				width : this.width,
				height : this.height,
				options : {
					wireframes : false
				}
			},
			world : {
				bounds : {
					max : {x : this.width * 1.2, y : this.height * 1.2}
				}
			},
		};

		var $root = $("#" + this.rootId);

		// 世界を創る
		var engine = Engine.create($root[0], options);

		this.canvas = engine.render.canvas;
		engine.render.canvas.width = this.width;
		engine.render.canvas.height = this.height;

		// 重力
		engine.world.gravity.x = this.gravityX;
		engine.world.gravity.y = this.gravityY;

		// 実行
		Engine.run(engine);

		this.engine = engine;

		this.resetBodies();

		//
		// ボディ作成
		//

		// 画面サイズに対する比率
		var rate = this.blockScale;

		// 画像あるかで場合分け
		if (this.loadedImage) {
			var imageRate = this.loadedImage.width / this.loadedImage.height;
			if (imageRate < 1) {
				// 縦基準
				var imageHeight = this.height * rate;
				body = this.getRectangleBody(imageHeight * imageRate, imageHeight);
			} else {
				// 横基準
				var imageWidth = this.width * rate;
				body = this.getRectangleBody(imageWidth, imageWidth / imageRate);
			}

			matterUtil.TextureSetting(body);
			body.image = this.loadedImage;
		} else {
			var size = Math.min(this.width, this.height) * rate;
			body = this.getRectangleBody(size, size);
		}

		this.blockList.push(body);
		World.add(engine.world, [body]);

		this.bindCanvasEvent(this.canvas);

		// ステップ後イベントハンドラ
		Matter.Events.on(engine, "afterRender", function(){
			// スプライト描画
			var ctx = engine.render.canvas.getContext("2d");
			for (var i = 0, max = self.blockList.length; i < max; i++){
				matterUtil.DrawTexture(self.blockList[i], ctx);
			}

			ctx.strokeStyle = "yellow";
			ctx.globalAlpha = 1;
			ctx.lineWidth = 2;

			// スラッシュ線描画
			self.slashLineList.forEach(function(line) {
				var start = line.s;
				var end = line.e;

				ctx.beginPath();
				ctx.moveTo(start.x, start.y);
				ctx.lineTo(end.x, end.y);
				ctx.stroke();

				line.life--;
			});

			// スラッシュ線削除
			self.slashLineList = self.slashLineList.filter(function(line) {
				// ライフが残っているものだけ回収
				return (line.life > 0);
			});
		});
	};

	/**
	 * ボディ作り直し
	 * @method resetBodies
	 */
	Constructor.prototype.resetBodies = function() {
		var engine = this.engine;

		World.clear(this.engine.world);
		Engine.clear(this.engine);

		//矩形で枠線を作る(rectangle(x座標,y座標,横幅,縦幅,option))
		var frameWidth = this.width;
		var frameHeight = this.height;
		var offset = 15;

		World.add(engine.world, [
			// 床
			Bodies.rectangle(
				frameWidth / 2,
				frameHeight,
				frameWidth + 2 * offset,
				offset,
				{ isStatic: true}),

			// 天井
			Bodies.rectangle(
				frameWidth / 2,
				0,
				frameWidth + 2 * offset,
				offset,
				{ isStatic: true}),

			// 右壁
			Bodies.rectangle(
				frameWidth,
				0,
				offset,
				2 * (frameHeight + 2 * offset),
				{ isStatic: true}),

			// 左壁
			Bodies.rectangle(
				0,
				0,
				offset,
				2 * (frameHeight + 2 * offset),
				{ isStatic: true})
		]);
	};

	/**
	 * 矩形ボディ取得
	 * @method getRectangleBody
	 * @param width {number} 幅
	 * @param height {number} 高さ
	 * @return {} matterのボディ
	 */
	Constructor.prototype.getRectangleBody = function(width, height) {
		// 4点
		var points = [
			{x : 0, y : 0},
			{x : width, y : 0},
			{x : width, y : height},
			{x : 0, y : height}
		];

		// プロパティ
		var prop = {
			position : {x : 0, y : 0},
			frictionAir : 0,
			friction : 0.1,
			restitution : 0.6,
			vertices : points,
			render : {
				fillStyle : "green",
				strokeStyle : "red",
				lineWidth : 3
			},
		};

		prop.position.x = this.width / 2;
		prop.position.y = this.height / 2;

		var body = Body.create(prop);

		return body;
	};

	/**
	 * キャンバスへのイベントハンドラ
	 * @method bindCanvasEvent
	 * @param target {} イベントハンドラ設定先
	 */
	Constructor.prototype.bindCanvasEvent = function(target) {
		var self = this;

		// 始点と終点記録用
		var slash = [];

		var length = this.width * this.width + this.height * this.height;

		$(target).on("mousedown touchstart", function(e) {
			// 始点記録
			slash.length = 0;
			slash[0] = canvasUtil.getCursorPoint(e);
		});

		$(target).on("mousemove touchmove", function(e) {
			e.preventDefault();

			// 終点記録
			if (slash.length > 0) {
				slash[1] = canvasUtil.getCursorPoint(e);
			}
		});

		$(target).on("mouseup mouseleave touchend touchcancel", function(e) {
			if (slash.length > 1) {
				// 長さチェック
				var vec = geoUtil.VecSub(slash[0], slash[1]);
				var slashLength = geoUtil.Length({x:0,y:0}, vec);
				if (slashLength > 5) {
					if (self.sound) {
						self.sound.play();
					}

					// 分割情報
					var info = matterUtil.SplitBodies(self.blockList, slash[0], slash[1]);

					// ボディリセット
					self.resetBodies();

					// 作り直し
					self.blockList = info.stay.concat(info.add);
					World.add(self.engine.world, self.blockList);

					// スラッシュ線として記録
					var scale = length / slashLength;
					vec = geoUtil.VecMult(vec, scale);

					// 外接円の半径分拡大
					var p1 = geoUtil.VecSub(slash[0], vec);
					var p2 = geoUtil.VecAdd(slash[1], vec);

					self.slashLineList.push({s : p1, e : p2, life : 60});
				}
			}

			slash.length = 0;
		});
	};

	return Constructor;
});
