#!/bin/bash
#
# Script to create the required data-dump
# (No upload logic)

# --- Config; please adjust ---

# Path to your pass.sh storage
passdir="$HOME/.password-store"
# Path were this script is installed
installdir="$passdir/bin"
# Export your private key to this file:
#    gpg --output private-key-export.bin --export-secret-key my-key
keyexport="$installdir/private-key-export.bin"
# Encryption of the whole dump. This ensures that the filenames are secured
# on your storage solution
dumppass="$installdir/dump-pass"
# Create the default php file yes/no
default_url=true

# Temp Storage
outfile="/tmp/pass-db-dump-$$"

# --- /Config ---

{
    cd "$passdir"
    echo '{'
    while IFS= read -rd '' f <&3; do
	echo "\"${f%.gpg}\": \"$(base64 --wrap=0 "$f")\"",
    done 3< <(find . -name "*.gpg" -printf '%P\0')
    # Well some password might be called _key but ... KISS!
    echo "\"_key\": \"$(base64 --wrap=0 "$keyexport")\""
    echo '}'
} | gpg --symmetric --batch --passphrase-file "$dumppass" --output "$outfile"

if $default_url; then
    sha1=$(tr -d '\n' < "$dumppass" | sha1sum | cut -d" " -f 1)
    sha256=$(tr -d '\n' < "$dumppass" | sha256sum | cut -d" " -f 1)
    cat > "$outfile.php" <<PHP
<?php
if(\$_SERVER['Authorization'] !== \$sha256) {
    header("HTTP/1.1 401 Unauthorized");
    die();
}

header("Content-Type: application/octet-stream");
echo base64_decode("$(base64 --wrap=0 <$outfile)");
PHP

    rm "$outfile"
    echo "Result $outfile.php must be uploaded as $sha1.php"
else
    echo "Result $outfile upload to your target"
fi
