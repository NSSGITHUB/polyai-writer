#!/bin/bash
# 自動編譯並部署 API 文件到 dist 資料夾

echo "開始編譯前端..."
npm run build

echo "複製 API 文件到 dist..."
cp -r api dist/

echo "設定 API 文件權限..."
chmod -R 755 dist/api
find dist/api -type f -name "*.php" -exec chmod 644 {} \;

echo "部署完成！"
echo "API 文件已複製到 dist/api/"
