echo "Updating submodules"
git submodule init
git submodule update
git submodule foreach 'git pull origin master'
echo "End submodules update"
