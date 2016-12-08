(function () {
    var concurrentUpdate = angular.module('concurrentUpdate', []);

    var EditPatientController = function ($scope) {
        $scope.isDisableControls = true;
        $scope.selectedProvider = "0";
        $scope.selectedUser = "0";
        $scope.selectedpatient = "0";
        
        $scope.providers = [
            {
                id: 1001,
                name: "Jackson Healthcare"
            },
            {
                id: 1002,
                name: "Madison Healthcare"
            }
        ];

        $scope.users = [
            {
                providerId: 1001,
                userId: 100101,
                name: "Maria Preethi"
            },
            {
                providerId: 1001,
                userId: 100102,
                name: "Sucheta Shukla"
            },
            {
                providerId: 1001,
                userId: 100103,
                name: "Subhash Walunj"
            },
            {
                providerId: 1002,
                userId: 100201,
                name: "Naveen Joonala"
            },
            {
                providerId: 1002,
                userId: 100202,
                name: "Rishi Walwalkar"
            },
            {
                providerId: 1002,
                userId: 100203,
                name: "Gautam Kochar"
            }
        ];
        
        $scope.patients = [
            {
                providerId: 1001,
                patientId: 1001001,
                name: "Steven Smith"
            },
            {
                providerId: 1001,
                patientId: 1001002,
                name: "Jimmy Watson"
            },
            {
                providerId: 1002,
                patientId: 1002001,
                name: "David Warnor"
            },
            {
                providerId: 1002,
                patientId: 1002002,
                name: "Glenn Maxwell"
            }
        ];
        
        $scope.setIsDisableControls = function() {
            $scope.selectedUser = "0";
            $scope.isDisableControls = ($scope.selectedProvider == "0") ? true : false;
        }
    }
    EditPatientController.$inject = ['$scope'];
    concurrentUpdate.controller('EditPatientController', EditPatientController);
})();