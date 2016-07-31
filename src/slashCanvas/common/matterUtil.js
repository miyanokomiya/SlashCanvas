define([ "matter", "slashCanvas/common/geoUtil" ], function(Matter, geoUtil) {
	/**
	 * Matter関連の汎用処理
	 * @static
	 * @namespace common
	 * @class matterUtil
	 */
	var matterUtil = {
		/**
		 * SVG形式からbody配列を作成する
		 *
		 * @method CreateGroup
		 * @param arr
		 *            {array} SVG形式の配列
		 * @param scale
		 *            {number} スケール値 nullなら原寸で1
		 * @param pos
		 *            {object} 初期位置 nullならsvgの指定通り
		 * @param label
		 *            {string} ラベル nullなら適当
		 * @returns {array} body配列
		 */
		CreateGroup : function(arr, scale, pos, label) {
			var bodies = [];

			var initP = {};

			scale = scale ? scale : 1;

			// 岡田作成
			for (var v = 0; v < arr.length; v++) {
				var body = Matter.Body.create(Matter.Common.extend({}, this
						.GetShape(arr[v], label)));

				// トリム
				var trimed = arr[v].replace(/(^\s+)|(\s+$)/g, "");

				var split = trimed.split(" ");
				var baseP = {
					x : parseFloat(split[1]),
					y : parseFloat(split[2])
				};
				var oldP = body.vertices[0];

				// 開始点を原点に移動
				Matter.Body.translate(body, Matter.Vector.mult(oldP, -1));
				// 図形位置をSVGの初期座標に移動
				Matter.Body.translate(body, baseP);

				// 位置調整用パラメータ、一番目の図形を基準とする
				var d = 1;
				if (v == 0) {
					initP = body.position;
				} else {
					d = scale;
				}

				// スケール調整
				Matter.Body.scale(body, scale, scale);

				// 基準座標を元にスケール調整後の位置合わせ
				var toP = Matter.Vector.mult(Matter.Vector.sub(initP,
						body.position), 1 - d);
				Matter.Body.translate(body, toP);

				// 保存
				bodies.push(body);
			}

			// 作成したグループの位置は不定なので位置調整
			if (pos) {
				this.SetGroupPosition(bodies, pos);
			}

			return bodies;
		},

		/**
		 * 適当なシェイプを取得する
		 *
		 * @method GetShape
		 * @param str
		 *            {string} SVG形式パス
		 * @param label
		 *            {string} ラベル 省略可
		 * @returns シェイプパラメータ入りオブジェクト
		 */
		GetShape : function(str, label) {
			return shape = {
				label : label || 'Shape Body',
				position : {
					x : 0,
					y : 0
				},
				frictionAir : 0,
				friction : 0.1,
				// isStatic : true,
				vertices : Matter.Vertices.fromPath(str),
				render : {
					fillStyle : "#234"
				}
			};
		},

		/**
		 * body群の位置をセットする<br>
		 * 全体を囲む矩形の中心を基準にセット
		 *
		 * @method SetGroupPosition
		 * @param arr
		 *            {array} body群
		 * @param pos
		 *            {object} 座標
		 */
		SetGroupPosition : function(arr, pos) {
			// 座標を全て取り出す
			var coordinates = arr.map(function(o) {
				return o.position;
			});
			// 座標全てを囲む矩形の中心を基準とする
			var center = geoUtil.CenteralPointOfAroundRectangle(coordinates);
			// 移動
			var setP = Matter.Vector.sub(pos, center);
			for (var v = 0; v < arr.length; v++) {
				Matter.Body.translate(arr[v], setP);
			}
		},

		/**
		 * body群をゆるく結合する制約を取得する
		 *
		 * @method CreateGroupConstraint
		 * @param bodies
		 *            {array} body群
		 * @returns {Array} 制約群
		 */
		CreateGroupConstraint : function(bodies) {
			var ret = [];

			for (var i = 1; i < bodies.length; i++) {
				var A = bodies[0];
				// var B = bodies_OKA[(i + 1) % bodies_OKA.length];
				var B = bodies[i];
				ret.push(Matter.Constraint.create({
					bodyA : A,
					bodyB : B,
					pointA : Matter.Vector.sub(B.position, A.position),
					// length: 0.01,
					stiffness : 0.2,
					angularStiffness : 0.001,
					render : {
						visible : false
					},
				}));

				ret.push(Matter.Constraint.create({
					bodyA : A,
					bodyB : B,
					pointA : Matter.Vector.add(Matter.Vector.sub(B.position,
							A.position), {
						x : 30,
						y : 30
					}),
					pointB : {
						x : 30,
						y : 30
					},
					// length: 0.01,
					stiffness : 0.008,
					angularStiffness : 0.001,
					render : {
						visible : false
					},
				}));
			}
			return ret;
		},

		/**
		 * 慣性継承
		 *
		 * @method InheritInertia
		 * @param baseBody
		 *            {object} 継承元
		 * @param targetBody
		 *            {object} 継承先
		 */
		InheritInertia : function(baseBody, targetBody) {
			var vec = {
				x : baseBody.position.x - baseBody.positionPrev.x,
				y : baseBody.position.y - baseBody.positionPrev.y,
			}

			targetBody.positionPrev.x -= vec.x;
			targetBody.positionPrev.y -= vec.y;
			targetBody.speed = baseBody.speed;
			targetBody.velocity.x = baseBody.velocity.x;
			targetBody.velocity.y = baseBody.velocity.y;
		},

		/**
		 * テクスチャ用設定 継承元が指定された場合は継承用の設定を行う
		 *
		 * @method TextureSetting
		 * @param target
		 *            {object} 設定対象
		 * @param parent
		 *            {object} 継承元 省略可
		 */
		TextureSetting : function(target, parent) {
			if (parent) {
				// 親から継承
				target.image = parent.image;
				// 基準角度更新
				target.orgAngle = parent.orgAngle + parent.angle;
				// 基準矩形更新
				target.orgRec = Matter.Common.clone(parent.orgRec, true);
				var vec = geoUtil.VecSub(target.position, parent.position);
				var sin = Math.sin(-target.orgAngle);
				var cos = Math.cos(-target.orgAngle);
				target.orgRec.x += vec.x * cos - vec.y * sin;
				target.orgRec.y += vec.x * sin + vec.y * cos;
			} else {
				// 初期設定
				// 矩形保存
				target.orgRec = geoUtil.AroundRectangle(target.vertices);
				// 点群を囲む矩形をテクスチャ範囲とする
				var center = {
					x : target.orgRec.x + target.orgRec.width / 2,
					y : target.orgRec.y + target.orgRec.height / 2,
				}
				var vec = geoUtil.VecSub(target.position, center);
				target.orgRec.x = vec.x;
				target.orgRec.y = vec.y;
				// 初期角度
				target.orgAngle = 0;
			}
		},

		/**
		 * テクスチャ描画
		 *
		 * @method DrawTexture
		 * @param target
		 *            {object} 描画対象body
		 * @param ctx
		 *            {objec} 描画コンテキスト
		 */
		DrawTexture : function(target, ctx) {
			if (target.image) {
				// 設定保存
				ctx.save();

				// クリッピング
				var points = target.vertices;
				ctx.beginPath();
				ctx.moveTo(points[0].x, points[0].y);
				for (var j = 1; j < points.length; j++) {
					ctx.lineTo(points[j].x, points[j].y);
				}
				ctx.closePath();
				ctx.clip();

				var width = target.orgRec.width;
				var height = target.orgRec.height;

				// 角度と位置合わせ
				ctx.translate(target.position.x, target.position.y)
				ctx.rotate(target.angle + target.orgAngle);
				ctx.translate(-width / 2 - target.orgRec.x, -height / 2
						- target.orgRec.y);

				// 描画
				ctx.drawImage(target.image, 0, 0, width, height);
				// 設定復元
				ctx.restore();
			}
		},

		/**
		 * 指定座標で分割したbodyを作成する
		 *
		 * @method CreateSplitBody
		 * @param body
		 *            {body} 分割元body
		 * @param points
		 *            {array]} 新しい図形座標配列
		 * @return {body} 分割したbody
		 */
		CreateSplitBody : function(body, points) {
			var baseP = {
				x : points[0].x,
				y : points[0].y,
			}
			var shape = this.CloneShape(body, points);
			var ret = Matter.Body.create(shape);

			// 位置合わせを行う
			Matter.Body.translate(ret, Matter.Vector
					.sub(baseP, ret.vertices[0]));
			// 慣性継承
			this.InheritInertia(body, ret);
			// テクスチャ関連
			this.TextureSetting(ret, body);
			return ret;
		},

		/**
		 * bodyの主要なプロパティを複製する
		 *
		 * @method CloneShape
		 * @param body
		 *            {body} 元body
		 * @param vertices
		 *            {array} 新しい座標配列
		 * @return {shape} body作成用シェイプオブジェクト
		 */
		CloneShape : function(body, vertices) {
			var shape = {
				label : body.label,
				position : {
					x : 0,
					y : 0
				},
				frictionAir : body.frictionAir,
				friction : body.friction,
				restitution : body.restitution,
				vertices : vertices,
				render : {
					fillStyle : body.render.fillStyle,
					strokeStyle : body.render.strokeStyle,
					lineWidth : body.render.lineWidth,
				}
			};
			return shape;
		},

		/**
		 * body群を直線で分割する
		 *
		 * @method SplitBodies
		 * @param bodies
		 *            {array} body配列
		 * @param p1
		 *            直線始点
		 * @param p2
		 *            直線終点
		 * @return {object} 分割後のbody情報<br/> {
		 *         <ul>
		 *         <li>add : {array} 新規追加(分割により作成された)body配列</li>
		 *         <li>remove : {array} 除外(切断された)body配列</li>
		 *         <li>stay : {array} 変化なしbody配列</li>
		 *         </ul>}
		 */
		SplitBodies : function(bodies, p1, p2) {
			var add = [];
			var remove = [];
			var stay = [];
			var line = [ p1, p2 ];

			// 切った方向への力として保存しておく
			var slashVec = geoUtil.VecSub(p2, p1);
			slashVec = geoUtil.VecUnit(slashVec);
			slashVec = geoUtil.VecMult(slashVec, 1 / 100);

			for (var i = 0, max = bodies.length; i < max; i++) {
				var body = bodies[i];
				// 座標分割
				var split = geoUtil.SplitPolyByLine(body.vertices, line);
				// 分割されていれば処理続行
				if (split.length === 2) {
					// 除去対象に追加
					remove.push(body);

					// body作成
					for (var j = 0; j < split.length; j++) {
						var baseP = {
							x : split[j][0].x,
							y : split[j][0].y,
						}
						// 分割body作成
						var splitBody = this.CreateSplitBody(body, split[j]);
						// 切り口から離れるように力加える
						var baseP = geoUtil.NearestPointOnLine(
								splitBody.position, line);
						var power = geoUtil.VecSub(splitBody.position, baseP);
						power = geoUtil.VecUnit(power);
						power = geoUtil.VecMult(power, 1 / 60);
						// 切った方向にも力加える
						power = geoUtil.VecAdd(power, slashVec);
						// 質量には依存させない
						power = geoUtil.VecMult(power, splitBody.mass / 50);
						Matter.Body.applyForce(splitBody, baseP, power);

						// ライフ設定
						if (body.lifeType === 0) {
							// スラッシュ数で生存判断
							splitBody.life = body.life / 2;
							splitBody.lifeType = 0;
							if (splitBody.life >= 1) {
								add.push(splitBody);
							}
						} else if (body.lifeType === 1) {
							// 質量で生存判断
							splitBody.life = Math.ceil(splitBody.mass - 3);
							splitBody.lifeType = 1;
							if (splitBody.mass >= 3) {
								add.push(splitBody);
							}
						} else {
							// 常に生存
							splitBody.life = "";
							splitBody.lifeType = 2;
							add.push(splitBody);
						}
					}
				} else {
					// 変化なし
					stay.push(body);
				}
			}

			return {
				add : add,
				remove : remove,
				stay : stay,
			}
		},
	};

	return matterUtil;
});