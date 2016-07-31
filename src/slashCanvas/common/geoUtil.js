/**
 * 数学系部品
 */

define([], function(){
	/**
	 * 幾何計算クラス
	 * @namespace Common.Util
	 * @class geoUtil
	 */
	var GeoUtil = {
		/**
		 * 0とみなす閾値
		 * @property MINVALUE
		 * @type {number}
		 */
		MINVALUE : 0.000001,

		/**
		 * 2点の距離を求める
		 * @method Length
		 * @param a {point} 点a
		 * @param b {point} 点b
		 * @returns {number} ab間の距離
		 */
		Length : function(a, b){
			b = b || {x:0,y:0}

			var dx = (a.x - b.x);
			var dy = (a.y - b.y);

			return Math.sqrt(dx * dx + dy * dy);
		},

		VecAdd : function(a, b){
			return {x: a.x + b.x, y: a.y + b.y};
		},

		VecSub : function(a, b){
			return {x: a.x - b.x, y: a.y - b.y};
		},

		VecMult : function(a, c){
			return {x: a.x * c, y: a.y * c};
		},

		VecUnit : function(v){
			var d = this.Length(v);

			return this.VecMult(v, 1/d)
		},

		/**
		 * 外積を求める<br/>
		 * = |a||b|sinθ
		 * @method Cross
		 * @param a {vecor}
		 * @param b {vector}
		 */
		Cross : function(a, b) {
			return a.x * b.y - a.y * b.x;
		},

		/**
		 * 内積を求める<br/>
		 * = |a||b|cosθ
		 * @method Inner
		 * @param a {vecor}
		 * @param b {vector}
		 */
		Inner : function(a, b) {
			return a.x * b.x + a.y * b.y;
		},

		PointCopy : function(a){
			if (a){
				return {x: a.x, y: a.y};
			} else {
				return null;
			}
		},

		PointArrayCopy : function(arr){
			var ret = [];

			for (var i = 0; i < arr.length; i++){
				ret.push(this.PointCopy(arr[i]));
			}
			return ret;
		},

		CentralPoint : function(a, b){
			var add = this.VecAdd(a, b)
			return this.VecMult(add, 1/2);
		},

		/**
		 * a点からb点へのラジアンを求める
		 */
		Radian : function(a, b){
			var dx = a.x - b.x;
			var dy = a.y - b.y;
			return (Math.atan2(dy ,dx) + (Math.PI * 2)) % (Math.PI * 2);
		},

		/**
		 * 2点の位置関係を求める
		 * 画面座標に対応するためy軸の正方向が下
		 * 4方向のテンキー表記で取得する
		 */
		Direction4 : function(a, b){
			var rad = this.Radian(a, b);
			if ((Math.PI * 7 / 4) < rad || rad <= (Math.PI * 1 / 4)){
				return 4;
			} else if ((Math.PI * 1 / 4) < rad && rad <= (Math.PI * 3 / 4)){
				return 8;
			} else if ((Math.PI * 3 / 4) < rad && rad <= (Math.PI * 5 / 4)){
				return 6;
			} else {
				return 2;
			}
		},

		/**
		 * 2点の位置関係を求める
		 * 画面座標に対応するためy軸の正方向が下
		 * 上下2方向のテンキー表記で取得する
		 */
		DirectionUD : function(a, b){
			if (a.y < b.y){
				return 2;
			} else {
				return 8;
			}
		},

		/**
		 * 2次方程式の解の公式
		 * a * x^2 + b * x + c
		 * 解に虚数が含まれる場合は解なし扱い
		 * @return 解の配列
		 */
		Solve2Func : function(a, b, c) {
			if(a === 0) {
				return b === 0 ? [] : [-c / b];
			}

			var d = b * b - 4 * a * c;
			if(d < 0) return [];

			var ia = 0.5 / a;

			if(d === 0) {
				return [-b * ia];
			}

			var sd = Math.sqrt(d);
			return [(-b + sd) * ia, (-b - sd) * ia];
		},

		/**
		 * 点から最短となる直線上の点を求める
		 * @method NearestPointOnLine
		 * @param p {point} 点p
		 * @param line {array} 直線上の2点AB
		 * @return {point} 最短の点
		 */
		NearestPointOnLine : function(P, line){
			var A = line[0];
			var B = line[1];
			var vecAB = this.VecSub(B, A);
			var vecAP = this.VecSub(P, A);
			var cross = this.Inner(vecAB, vecAP);
			var rate = cross / this.Inner(vecAB, vecAB);
			return this.VecAdd(A, this.VecMult(vecAB, rate));
		},

		/**
		 * 二次ベジェ曲線と直線の当たり判定用パラメータを取得する
		 * @param p0 ベジェ曲線始点
		 * @param p1 ベジェ曲線制御点
		 * @param p2 ベジェ曲線終点
		 * @param p 直線始点
		 * @param q 直線終点
		 * @return ベジェ曲線パラメータ
		 */
		rayToBezier2 : function(p0, p1, p2, p, q) {
			var vx = q.x - p.x,
				vy = q.y - p.y,
				a = p0.x - 2 * p1.x + p2.x,
				b = 2 * (p1.x - p0.x),
				c = p0.x,
				d = p0.y - 2 * p1.y + p2.y,
				e = 2 * (p1.y - p0.y),
				f = p0.y;

			var t = this.Solve2Func(
				a * vy - vx * d,
				b * vy - vx * e,
				vy * c - vy * p.x - vx * f + vx * p.y
			);

			return t;
		},

		/**
		 * 二次ベジェ曲「線分」と「直線」の交点を取得する
		 * @param p0 ベジェ曲線始点
		 * @param p1 ベジェ曲線制御点
		 * @param p2 ベジェ曲線終点
		 * @param p 直線始点
		 * @param q 直線終点
		 */
		CrossLineAndBezier : function(p0, p1, p2, p, q){
			// パラメータ取得
			var t = this.rayToBezier2(p0, p1, p2, p, q);

			var vx = q.x - p.x,
				vy = q.y - p.y;

			var ret = [];
			for (var i = 0; i < t.length; i++){
				if (0 <= t[i] && t[i] <= 1){
					// ベジェ曲線分上の点を求める
					ret.push({
						x: (p2.x - 2 * p1.x + p0.x) * t[i] * t[i] + 2 * (p1.x - p0.x) * t[i] + p0.x,
						y: (p2.y - 2 * p1.y + p0.y) * t[i] * t[i] + 2 * (p1.y - p0.y) * t[i] + p0.y,
					});
				}
			}
			return ret;
		},

		/**
		 * 座標郡を囲む矩形を取得する
		 * 境界上に重なる
		 * @param arr 座標郡
		 * @returns {x,y,width,height} 矩形情報
		 */
		AroundRectangle : function(arr){
			var min = {
				x : Math.min.apply(null,arr.map(function(o){return o.x;})),
				y : Math.min.apply(null,arr.map(function(o){return o.y;}))
			};

			var max = {
					x : Math.max.apply(null,arr.map(function(o){return o.x;})),
					y : Math.max.apply(null,arr.map(function(o){return o.y;}))
				};

			return {
				x : min.x,
				y : min.y,
				width : max.x - min.x,
				height : max.y - min.y,
			};
		},

		/**
		 * 座標群を囲む矩形の中心を取得する
		 * @param arr 座標群
		 * @returns {x,y} 中心座標
		 */
		CenteralPointOfAroundRectangle : function(arr){
			var lec = this.AroundRectangle(arr);
			return {
				x : lec.x + (lec.width / 2),
				y : lec.y + (lec.height / 2),
			}
		},

		CrossAreaAndSeg : function(area, seg){
			var ret = [];



			return ret;
		},

		/**
		 * 面に点が含まれているか判定する
		 * 境界を含む判定
		 * @param arr 面の座標群
		 * @returns 含まれているならtrue
		 */
		IsContainPoint : function(area, point){
			// 判定対象線分取得
			var lines = [];
			for (var i = 0; i < area.length; i++){
				var p1 = area[i % area.length];
				var p2 = area[(i + 1) % area.length];
				if (p1.x >= point.x || p2.x >= point.x){
					// 保存
					lines.push([p1, p2]);
				}
			}

			var count = 0;
			for (var i = 0; i < lines.length; i++){
				// x方向で交わった線分をカウントする

				// エリアの最大となるx座標を求める
				var rec = this.AroundRectangle(area);
				var max = rec.x + rec.width;

				if (this.IsCrossSegAndSeg([point, {x: max, y:point.y}], lines[i])){
					count++;
				}
			}

			return count = (count % 2) === 0 ? false : true;
		},

		/**
		 * ベジェ曲線を含む面に点が含まれるか判定
		 * area[0]とarea[1]の制御点はbezier[1]となる
		 * areaの最後と最初の制御点はbezier[0]となる
		 * 制御点がない部分はbezier内のその要素にnullを入れること
		 * @param area 面の座標
		 * @param bezier 制御点
		 * @param 判定する点
		 * @returns 含まれているならtrue
		 */
		IsContainPointBezier : function(area, bezier, point){
			var pointCount = area.length;
			// 判定対象線分取得
			var lines = [];
			var bezierLines = [];
			for (var i = 0; i < pointCount; i++){
				var p1 = area[i % pointCount];
				var p2 = area[(i + 1) % pointCount];
				//if (p1.x >= point.x || p2.x >= point.x){
				if (true){
					// ベジェは分ける
					if (bezier[(i + 1) % pointCount]){
						bezierLines.push([p1, bezier[(i + 1) % pointCount], p2]);
					} else {
						lines.push([p1, p2]);
					}
				}
			}

			// 交わった合計
			var count = 0;

			// エリアの最大となるx座標を求める
			var rec = this.AroundRectangle(area);
			// x方向に伸ばす
			var max = (rec.x + rec.width) * 10;
			var rightP = {x: max, y:point.y};

			// 直線を判定
			for (var i = 0; i < lines.length; i++){
				// x方向で交わった線分をカウントする
				if (this.IsCrossSegAndSeg([point, rightP], lines[i])){
					count++;
				}
			}

			// ベジェを判定
			for (var i = 0; i < bezierLines.length; i++){
				// x方向で交わった線分をカウントする
				var p0 = bezierLines[i][0];
				var p1 = bezierLines[i][1];
				var p2 = bezierLines[i][2];

				// 直線とベジェ曲線分の交点取得(なし、1点、2点の場合あり)
				var crossPs = this.CrossLineAndBezier(p0, p1, p2, point, rightP);

				// 交点数分だけ線分内か判定
				for (var j = 0; j < crossPs.length; j++){
					if (crossPs[j].x >= point.x){
						count++;
					}
				}
			}

			// 交点数が奇数なら面内となる
			return count = (count % 2) === 0 ? false : true;
		},

		/**
		 * 線分と線分の交差判定
		 * 線分同士が重なっている場合は交差なし扱い
		 */
		IsCrossSegAndSeg : function(ab, cd) {
			return this._IsCrossSegAndSeg(ab[0].x, ab[0].y, ab[1].x, ab[1].y, cd[0].x, cd[0].y, cd[1].x, cd[1].y);
		},

		_IsCrossSegAndSeg : function(ax, ay, bx, by, cx, cy, dx, dy) {
			var ta = (cx - dx) * (ay - cy) + (cy - dy) * (cx - ax);
			var tb = (cx - dx) * (by - cy) + (cy - dy) * (cx - bx);
			var tc = (ax - bx) * (cy - ay) + (ay - by) * (ax - cx);
			var td = (ax - bx) * (dy - ay) + (ay - by) * (ax - dx);

			return tc * td < 0 && ta * tb < 0;
		},

		/**
		 * 直線と線分の交差判定
		 */
		IsCrossLineAndSeg : function(line, seg){
			var c0 = this.Cross(line[0], this.VecSub(seg[0], line[1]));
			var c1 = this.Cross(line[0], this.VecSub(seg[1], line[1]));
			if(c0 * c1 < 0) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 * 平行判定
		 * @param ab ベクトル or 2点の配列
		 * @param cd 同上
		 * @return 平行である
		 */
		IsHorizontal : function(ab, cd){
			ab = ab.x != null ? ab : this.VecSub(ab[1], ab[0]);
			cd = cd.x != null ? cd : this.VecSub(cd[1], cd[0]);

			var rad = this.Radian(ab, cd);
			if (Math.abs(rad) % Math.PI < this.MINVALUE){
				return true;
			} else {
				return false;
			}
		},

		CrossPolygonAndLine : function(pol, line){
			var ret = [];
			var length = pol.length;
			for (var i = 0; i < length; i++){
				// 辺取得
				var targetLine = [pol[i % length], pol[(i + 1) % length]];
				// 交点取得
				var p = this.CrossSegAndLine(targetLine, line)
				if (p !== null){
					ret.push(p);
				}
			}
			return ret;
		},

		/**
		 * 線分と直線の交点取得
		 */
		CrossSegAndLine : function(ab, cd){
			if (this.IsHorizontal(ab, cd)){
				// 平行判定
				return null;
			}

			var s1 = ((cd[1].x - cd[0].x) * (ab[0].y - cd[0].y) - (cd[1].y - cd[0].y) * (ab[0].x - cd[0].x)) / 2;
			var s2 = ((cd[1].x - cd[0].x) * (cd[0].y - ab[1].y) - (cd[1].y - cd[0].y) * (cd[0].x - ab[1].x)) / 2;

			var rate = s1 / (s1 + s2);

			if (0 < rate && rate < 1){
				return {
					x: ab[0].x + (ab[1].x - ab[0].x) * rate,
					y: ab[0].y + (ab[1].y - ab[0].y) * rate};
			} else {
				return null;
			}
		},

		/**
		 * ポリゴンを直線で分割する
		 * 交点は2点までであること前提
		 * @return 分割された点配列の配列
		 */
		SplitPolyByLine : function(pol, line){
			var points = [];
			var crossIndex = [];
			var length = pol.length;
			for (var i = 0; i < length; i++){
				// 辺取得
				var targetLine = [pol[i % length], pol[(i + 1) % length]];
				// 交点取得
				var p = this.CrossSegAndLine(targetLine, line)

				// 点追加
				points.push(pol[i % length]);
				if (p !== null){
					// 交点追加
					points.push(p);
					// 交点インデックス保存
					crossIndex.push(i + 1 + crossIndex.length);
				}
			}

			// 分割
			var ret = [];

			if (crossIndex.length == 2){
				// 1つ目
				var splitPol = [];
				// 交点まで追加
				for (var i = 0; i <= crossIndex[0]; i++){
					splitPol.push({
						x: points[i].x,
						y: points[i].y,
					});
				}
				// 交点から追加
				for (var i = crossIndex[1]; i < points.length; i++){
					splitPol.push({
						x: points[i].x,
						y: points[i].y,
					});
				}
				// 確定
				ret.push(splitPol);
				splitPol = [];

				// 2つ目
				// 交点から交点まで追加
				for (var i = crossIndex[0]; i <= crossIndex[1]; i++){
					splitPol.push({
						x: points[i].x,
						y: points[i].y,
					});
				}
				// 確定
				ret.push(splitPol);
				splitPol = [];
			}

			return ret;
		},
	};

	return GeoUtil;
});
