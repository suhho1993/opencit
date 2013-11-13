#!/bin/sh
# decrypt.sh - decrypt and verify with hmac
# assumes the input file has the following structure:
#Content-Type: encrypted/openssl; alg="aes-256-ofb"; digest-alg="sha256"
#Date: Wed Nov 13 00:19:58 PST 2013
#
#<base64 content here>
#-----
#Content-Type: application/signature.openssl; alg="hmac"; digest-alg="sha256"
#
#07f2b754414cdbc0e7edadb66342a45d4eee1c0f354e316186e92b1c2eb42be4
# the hmac is over the entire file including the newline right before
# the line where the hmac itself is appended.
# if you add any other headers to the file (to be included in the hmac)
# you need to adjust the +/- numbers on the head and tail commands below.

infile=t
outfile=x
export PASSWORD=uifsjksjksdhhsdffsljklzakldasfk

# assume the mac value is the last line of the file
inputmac=$(tail -n 1 $infile)
#echo $inputmac

# calculate the hmac over the entire file except fo rthe last line
calcmac=$(head -n -1 $infile | openssl dgst -sha256 -hmac env:PASSWORD -hex | awk '{ print $2 }')
#echo $calcmac

if [ "$inputmac" != "$calcmac" ]; then
  echo "Message failed verification"
  exit 1
fi

# decrypt the base64 content but first need to extract it from message:
# skip three lines from the beginning (content-type, date, and blank)
# and skip three lines from the end (content-type, blank line, and hmac)
tail -n +3 $infile | head -n -3 | openssl enc -d -aes-256-ofb -pass env:PASSWORD -md sha256 -base64 > $outfile
