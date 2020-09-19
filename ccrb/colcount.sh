#!/bin/bash

FILE=$1
readarray -d , -t strarr <<< `head -n 1 $FILE`
L=`echo ${#strarr[@]} - 1 | bc` 
for i in `seq 0 $L`; do
    echo -ne "${strarr[$i]}":`echo $i + 1 | bc` '|' 
done
echo
echo choose colnum
read COLNUM
tail -n +2 $FILE | cut -d , -f $COLNUM | sort | uniq -c | less
