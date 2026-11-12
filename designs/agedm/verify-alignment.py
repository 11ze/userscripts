"""从按钮截图比较红色圆形和白色交叉线的像素中心。需要 Pillow。"""

import argparse
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('image')
parser.add_argument('box', nargs=4, type=int, help='按钮所在区域：left top right bottom')
args = parser.parse_args()
image = Image.open(args.image).convert('RGB')
left, top, right, bottom = args.box
red = []
for y in range(top, bottom):
    for x in range(left, right):
        r, g, b = image.getpixel((x, y))
        if r > 170 and r > g * 1.7 and r > b * 1.4:
            red.append((x, y))
assert red, '区域内无红色按钮'
x0, x1 = min(x for x, y in red), max(x for x, y in red)
y0, y1 = min(y for x, y in red), max(y for x, y in red)
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
# 只读取圆形内部，排除按钮边框和键盘焦点轮廓。
rx, ry = (x1 - x0) * 0.3, (y1 - y0) * 0.3
white = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)
         if abs(x - cx) <= rx and abs(y - cy) <= ry
         and min(image.getpixel((x, y))) > 150]
assert white, '圆形内部无白色交叉线'
gx = (min(x for x, y in white) + max(x for x, y in white)) / 2
gy = (min(y for x, y in white) + max(y for x, y in white)) / 2
dx, dy = gx - cx, gy - cy
print(f'像素中心偏差：dx={dx:g}px, dy={dy:g}px')
assert abs(dx) <= 0.5 and abs(dy) <= 0.5, '交叉线未居中（允许半个像素的栅格误差）'
