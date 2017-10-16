if [ -n "$1" ]
then
# Перекодирование заставки в mp4 размер кадра 720x480 битрейт 1000 кб/с и ts
ffmpeg -i screen.mp4 -vf scale=720:480 -strict -2 screen_720_480.mp4 -b 1000kb -vcodec mpeg4 -y
ffmpeg -i screen_720_480.mp4 -acodec copy -vcodec copy -vbsf h264_mp4toannexb -f mpegts screen_720_480.ts -y

# Имя файла без расширения
name=${1%.*}
# Имя перекодированного файла 720x480
name_720_480="${name}_720x480"

# Перекодирование файла конкурсанта в mp4 размер кадра 720x480 битрейт 1000 кб/с и ts
ffmpeg -i $1 -vf scale=720:480 -strict -2 $name_720_480.mp4 -b 1000kb -vcodec mpeg4 -y
ffmpeg -i $name_720_480.mp4 -acodec copy -vcodec copy -vbsf h264_mp4toannexb -f mpegts $name_720_480.ts -y

# Склеивание заставки и файла конкурсанта 
ffmpeg -i "concat:screen_720_480.ts|$name_720_480.ts" -vcodec copy -acodec copy -bsf:a aac_adtstoasc screen_$name.mp4 -y

# Удаление временных файлов
rm $name_720_480.mp4 $name_720_480.ts screen_720_480.mp4 screen_720_480.ts
else
echo "использование: bash concat_video.sh <имя_файла>"
echo "пример: bash concat_video.sh test.mp4"
fi