//--------------------------------------------------------------------------------
// CMLMovieClip Scene management module
//--------------------------------------------------------------------------------


package org.si.b3 {
    import flash.geom.*;
    import flash.display.*;
    
    
    /** CMLMovieClipTexture provides BitmapData for CMLMovieClip. */
    public class CMLMovieClipTexture {
    // variables
    //--------------------------------------------------
        /** source bitmap data */
        public var bitmapData:BitmapData;
        
        /** cutout rectangle */
        public var rect:Rectangle;
        /** texture center */
        public var center:Point;
        /** texture anchor point */
        public var anchor:Point;
        /** cutout bitmap data */
        public var cutoutBitmapData:BitmapData = null;
        /** alpha map */
        public var alphaMap:CMLMovieClipTexture = null;
        /** animation pattern */
        public var animationPattern:Vector.<CMLMovieClipTexture> = null;
        
        
        
        
    // properties
    //--------------------------------------------------
        /** texture width */
        public function get width() : int { return rect.width; }
        /** texture height */
        public function get height() : int { return rect.height; }
        /** true if you want to use CMLMovieClip.draw() */
        public function get drawable() : Boolean { return (cutoutBitmapData != null); }
        public function set drawable(b:Boolean) : void {
            if (cutoutBitmapData) {
                cutoutBitmapData.dispose();
                cutoutBitmapData = null;
            }
            if (b) {
                cutoutBitmapData = new BitmapData(rect.width, rect.height, bitmapData.transparent, 0);
                cutoutBitmapData.copyPixels(bitmapData, rect, new Point(0, 0));
            }
            if (animationPattern && animationPattern.length > 1) {
                for (var i:int=1; i<animationPattern.length; i++) {
                    animationPattern[i].drawable = b;
                }
            }
        }
        /** animation count */
        public function get animationCount() : int { return (animationPattern) ? animationPattern.length : 0; }
        
        
        
        
    // constructor
    //--------------------------------------------------
        /** constructor 
         *  @param bitmapData source texture
         *  @param texX x coordinate of left edge on source texture
         *  @param texY y coordinate of top edge on source texture
         *  @param texWidth texture width
         *  @param texHeight texture height
         *  @param drawable true to use CMLMovieClip.drawTexture()
         *  @param animationCount animation count
         *  @param areaWidth area width of animation sequence
         *  @param areaHeight area height of animation sequence
         *  @param columnPriority scanning direction of animation sequence, true for horizontal
         */
        function CMLMovieClipTexture(bitmapData:BitmapData, texX:int=0, texY:int=0, texWidth:int=0, texHeight:int=0, drawable:Boolean=false, animationCount:int=1, areaWidth:int=0, areaHeight:int=0, columnPriority:Boolean=true) 
        {
            if (texWidth  == 0) texWidth  = bitmapData.width;
            if (texHeight == 0) texHeight = bitmapData.height;
            this.cutoutBitmapData = null;
            this.bitmapData = bitmapData;
            this.rect = new Rectangle(texX, texY, texWidth, texHeight);
            this.center = new Point(texWidth * 0.5, texHeight * 0.5);
            this.anchor = new Point(center.x, center.y);
            this.drawable = drawable;
            this.alphaMap = null;
            if (animationCount > 0) {
                animationPattern = new Vector.<CMLMovieClipTexture>(animationCount, true);
                animationPattern[0] = this;
                
                if (animationCount > 1) {
                    var x:int = texX + texWidth, y:int = texY, xmax:int = texX + areaWidth - texWidth, ymax:int = texY + areaHeight - texHeight;
                    if (areaWidth == 0)  xmax = bitmapData.width  - texWidth;
                    if (areaHeight == 0) ymax = bitmapData.height - texHeight;
                    
                    for (var i:int=1; i<animationCount; i++) {
                        animationPattern[i] = new CMLMovieClipTexture(bitmapData, x, y, texWidth, texHeight, drawable, 0);
                        if (columnPriority) {
                            x += texWidth;
                            if (x > xmax) {
                                x = texX;
                                y += texHeight;
                            }
                        } else {
                            y += texHeight;
                            if (y > ymax) {
                                x += texWidth;
                                y = texY;
                            }
                        }
                    }
                }
            }
        }
        
        
        /** cloning */
        public function clone() : CMLMovieClipTexture 
        {
            var newTexture:CMLMovieClipTexture = new CMLMovieClipTexture(bitmapData, rect.x, rect.y, rect.width, rect.height),
                i:int, imax:int = animationCount;
            newTexture.cutoutBitmapData = cutoutBitmapData;
            newTexture.alphaMap = alphaMap;
            newTexture.center.x = center.x;
            newTexture.center.y = center.y;
            if(imax) {
                newTexture.animationPattern = new Vector.<CMLMovieClipTexture>(imax, true);
                newTexture.animationPattern[0] = newTexture;
                for (i=1; i<imax; i++) {
                    newTexture.animationPattern[i] = animationPattern[i].clone();
                }
            }
            return newTexture;
        }
        
        
        /** cut out texture with scaling and rotation
         *  @param scaleX horizontal scaling factor
         *  @param scaleY vertical scaling factor
         *  @param angle rotation angle in degree
         *  @param colorTransform color transform
         *  @param backgroundColor bacground color
         *  @param margin margin around the result texture
         *  @return cut out texture. property "drawable" is true.
         */
        public function cutout(scaleX:Number=1, scaleY:Number=1, angle:Number=0, colorTransform:ColorTransform=null, backgroundColor:uint=0, margin:int=0) : CMLMovieClipTexture 
        {
            var newTexture:CMLMovieClipTexture = _cutout(scaleX, scaleY, angle, colorTransform, backgroundColor, margin),
                i:int, imax:int = animationPattern.length;
            newTexture.animationPattern = new Vector.<CMLMovieClipTexture>(imax, true);
            newTexture.animationPattern[0] = newTexture;
            for (i=1; i<imax; i++) {
                newTexture.animationPattern[i] = animationPattern[i]._cutout(scaleX, scaleY, angle, colorTransform, backgroundColor, margin);
            }
            return newTexture;
        }
        
        
        /** create rotate animation
         *  @param scaleX horizontal scaling factor
         *  @param scaleY vertical scaling factor
         *  @param minAngle start angle in degree
         *  @param maxAngle end angle in degree
         *  @param animationCount animation count 
         *  @param colorTransform color transform
         *  @param backgroundColor bacground color
         *  @param margin margin around the result texture
         *  @return animation sequence of cut out textures. property "drawable" is true.
         */
        public function createRotateAnimation(scaleX:Number=1, scaleY:Number=1, minAngle:Number=-180, maxAngle:Number=180, animationCount:int=32, 
                                              colorTransform:ColorTransform=null, backgroundColor:uint=0, margin:int=0) : CMLMovieClipTexture 
        {
            var i:int, step:Number = (maxAngle - minAngle) / animationCount, angle:Number = minAngle, patterns:Vector.<CMLMovieClipTexture>;
            patterns = new Vector.<CMLMovieClipTexture>(animationCount, true);
            for (i=0; i<animationCount; i++, angle+=step) {
                patterns[i] = _cutout(scaleX, scaleY, angle, colorTransform, backgroundColor, margin);
            }
            patterns[0].animationPattern = patterns;
            return patterns[0];
            
        }
        
        
        /** create alpha map 
         *  @param fillColor filling color
         */
        public function createAlphaMap(fillColor:uint=0xffffffff) : CMLMovieClipTexture
        {
            var alphaBitmap:BitmapData = new BitmapData(rect.width, rect.height, true, fillColor);
            alphaBitmap.copyChannel(bitmapData, rect, new Point(0, 0), BitmapDataChannel.ALPHA, BitmapDataChannel.ALPHA);
            alphaMap = new CMLMovieClipTexture(alphaBitmap, 0, 0, 0, 0, drawable);
            if (animationPattern && animationPattern.length > 1) {
                for (var i:int=1; i<animationPattern.length; i++) {
                    animationPattern[i].createAlphaMap(fillColor);
                }
            }
            return this;
        }
        
        
        private function _cutout(sx:Number, sy:Number, rot:Number, colt:ColorTransform, bg:uint, margin:int) : CMLMovieClipTexture
        {
            var mat:Matrix = new Matrix(), srcx:Number, srcy:Number, srcxmin:Number ,srcymin:Number, srcxmax:Number ,srcymax:Number, 
                x:int, y:int, xmax:int, ymax:int, dst:BitmapData, ma:Number, mb:Number, mc:Number, md:Number, tx:Number, ty:Number;
            mat.translate(-center.x, -center.y);
            mat.scale(sx, sy);
            mat.rotate(rot * 0.017453292519943295);
            var lt:Point = mat.transformPoint(new Point(0, 0)),
                rt:Point = mat.transformPoint(new Point(rect.width, 0)),
                lb:Point = mat.transformPoint(new Point(0, rect.height)),
                rb:Point = mat.transformPoint(new Point(rect.width, rect.height)),
                dstrb:Point = new Point(_max4(lt.x, rt.x, lb.x, rb.x), _max4(lt.y, rt.y, lb.y, rb.y));
            xmax = int(dstrb.x + margin + 0.9999847412109375) * 2;
            ymax = int(dstrb.y + margin + 0.9999847412109375) * 2;
            dst = new BitmapData(xmax, ymax, bitmapData.transparent, bg);
            mat.translate(dst.width * 0.5, dst.height * 0.5);
            mat.invert();
            ma = mat.a;
            mb = mat.b;
            mc = mat.c;
            md = mat.d;
            tx = mat.tx + rect.x;
            ty = mat.ty + rect.y;
            srcxmin = rect.x;
            srcymin = rect.y;
            srcxmax = rect.x + rect.width;
            srcymax = rect.y + rect.height;
            for (x=0; x<xmax; x++) for (y=0; y<ymax; y++) {
                srcx = x * ma + y * mc + tx;
                srcy = x * mb + y * md + ty;
                if (srcx>=srcxmin && srcx<srcxmax && srcy>=srcymin && srcy<srcymax) {
                    dst.setPixel32(x, y, bitmapData.getPixel32(int(srcx), int(srcy)));
                }
            }
            if (colt) dst.colorTransform(dst.rect, colt);
            var ret:CMLMovieClipTexture = new CMLMovieClipTexture(dst, 0, 0, xmax, ymax, false, 0);
            ret.cutoutBitmapData = dst;
            return ret;
        }
        
        
        private function _min4(a:Number, b:Number, c:Number, d:Number) : Number {
            return (a < b) ? ((a < c) ? ((a < d) ? a : d) : ((c < d) ? c : d)) : ((b < c) ? ((b < d) ? b : d) : ((c < d) ? c : d));
        }
        
        
        private function _max4(a:Number, b:Number, c:Number, d:Number) : Number {
            return (a > b) ? ((a > c) ? ((a > d) ? a : d) : ((c > d) ? c : d)) : ((b > c) ? ((b > d) ? b : d) : ((c > d) ? c : d));
        }
    }
}


