ssh:
	ssh deploy@pc-api.btmx.fr

dump_db:
	mkdir -p $(dir $(realpath $(firstword $(MAKEFILE_LIST))))db_dumps
	docker exec `docker ps | grep postgres | cut -d' ' -f 1` pg_dump -d pass_culture -U pass_culture -F c > $(dir $(realpath $(firstword $(MAKEFILE_LIST))))db_dumps/`date +%Y%m%d_%H%M%S`.pgdump

restore_db:
	cat $(backup_file) | bunzip2 | docker exec -i `docker ps | grep postgres | cut -d' ' -f 1` pg_restore -d pass_culture -U pass_culture

install:
	yarn global add concurrently
	git submodules init
	git submodules update
	git submodules foreach git checkout origin master
	cd webapp && yarn

recreate:
	rm -rf api/postgres_data
	docker-compose up --force-recreate

start:
	concurrently "docker-compose up" "cd webapp && yarn start"
