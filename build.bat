@echo off
pwp -H 192.168.21.209 -u administrator -a C:\Users\drew.chase\.ssh\mss-sshkey_ossh.key -s storeorders --binary store_orders -BIStc "npm run build"