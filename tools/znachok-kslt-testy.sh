#!/bin/bash
# Значок «КСЛТ Тесты».
#
# Тут НАМЕРЕННО три строки. Вся логика — в репозитории, в
# tools/zapusk-testov.sh: он под git, его видно в истории и его можно
# править. Внутри .app правок никто бы не увидел.
exec /Users/bossyko/Documents/KSLT/tools/zapusk-testov.sh "$@"
