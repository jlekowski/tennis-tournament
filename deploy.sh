#!/usr/bin/env bash
make build
ssh dev-1 "rm /var/www/lekowski.tennis/tennis-tournament/assets/*"
scp -r dist/* dev-1:/var/www/lekowski.tennis/tennis-tournament
