#!/bin/bash

/var/www/wsc/node_modules/pm2/bin/pm2 delete all
/var/www/wsc/node_modules/pm2/bin/pm2 start index.js
