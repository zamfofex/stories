#!/usr/bin/env bash
set -e

rm -rf public/*
mkdir -p public/scripts

ln pages/{robots.txt,style.css,icon.svg} public
ln pages/scripts/* public/scripts
cp pages/list.html public/index.html

cd stories
for name in $(cat list.txt)
do
	mkdir "../public/$name"
	
	title="$(head -1 "$name.txt" | sed -n 's;<h1>\(.*\)</h1>;\1;p')"
	
	echo "$title" | sed -e '/((title))/{r /dev/stdin' -e 'd}' ../pages/story.html > "../public/$name/index.html"
	cat "$name.txt" >> "../public/$name/index.html"
	printf '<p class="end">the end</p>\n' >> "../public/$name/index.html"
	
	printf '<a href="/%s/">\n\t<article>\n\t\t<h2>%s</h2>\n%s\n\t</article>\n</a>\n' "$name" "$title" "$(sed 's/^/\t\t/' "about/$name.txt")" >> ../public/index.html
done
