﻿using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using WowUp.Common.Enums;
using WowUp.Common.Models;
using WowUp.WPF.Services.Contracts;
using WowUp.WPF.Utilities;
using WowUp.WPF.Views;

namespace WowUp.WPF.ViewModels
{
    public class GetAddonsViewModel : BaseViewModel
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IAddonService _addonService;
        private readonly IWarcraftService _warcraftService;

        private IList<WowClientType> _clientTypes;
        private IList<string> _clientNames;

        private List<PotentialAddon> _popularAddons;

        private int _selectedWowIndex = 0;
        public int SelectedWowIndex
        {
            get => _selectedWowIndex;
            set { 
                SetProperty(ref _selectedWowIndex, value);
                OnSelectedWowChange();
            }
        }

        private string _searchText;
        public string SearchText
        {
            get => _searchText;
            set { SetProperty(ref _searchText, value); }
        }

        public WowClientType SelectedClientType => _clientTypes[SelectedWowIndex];

        public ObservableCollection<PotentialAddonListItemViewModel> DisplayAddons { get; set; }
        public ObservableCollection<ComboBoxItem> ClientNames { get; set; }
        public Command RefreshCommand { get; set; }
        public Command SearchCommand { get; set; }
        public Command InstallNewCommand { get; set; }

        public GetAddonsViewModel(
            IServiceProvider serviceProvider,
            IAddonService addonService,
            IWarcraftService warcraftService)
        {
            _addonService = addonService;
            _serviceProvider = serviceProvider;
            _warcraftService = warcraftService;

            _clientTypes = new List<WowClientType>();
            _clientNames = new List<string>();

            ClientNames = new ObservableCollection<ComboBoxItem>();
            DisplayAddons = new ObservableCollection<PotentialAddonListItemViewModel>();

            RefreshCommand = new Command(() => OnRefresh());
            SearchCommand = new Command((text) => OnSearch((string)text));
            InstallNewCommand = new Command(() => OnInstallFromUrl());

            _addonService.AddonUninstalled += (sender, args) =>
            {
                OnRefresh();
            };
        }

        public async void OnInitialized()
        {
            _clientTypes = _warcraftService.GetWowClientTypes();
            _clientNames = _warcraftService.GetWowClientNames();

            for (var i = 0; i < _clientNames.Count; i += 1)
            {
                var clientName = _clientNames[i];
                ClientNames.Add(new ComboBoxItem
                {
                    Content = clientName
                });
            }

            await LoadPopularAddons();
        }

        private async void OnRefresh()
        {
            if (string.IsNullOrEmpty(SearchText))
            {
                await LoadPopularAddons();
            }
            else
            {
                OnSearch(SearchText);
            }
        }

        private async void OnSearch(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                await LoadPopularAddons();
                return;
            }

            IsBusy = true;

            var searchResults = await _addonService.Search(text, SelectedClientType);

            DisplayAddons.Clear();
            foreach(var result in searchResults)
            {
                var viewModel = _serviceProvider.GetService<PotentialAddonListItemViewModel>();
                viewModel.ClientType = SelectedClientType;
                viewModel.IsInstalled = _addonService.IsInstalled(result.ExternalId, SelectedClientType);
                viewModel.Addon = result;

                DisplayAddons.Add(viewModel);
            }

            IsBusy = false;
        }

        private async void OnSelectedWowChange()
        {
            await LoadPopularAddons();
        }

        private void OnInstallFromUrl()
        {
            // Instantiate the dialog box
            var dlg = _serviceProvider.GetService<InstallUrlWindow>();
            (dlg.DataContext as InstallUrlDialogViewModel).ClientType = SelectedClientType;

            // Configure the dialog box
            dlg.Owner = Application.Current.MainWindow;

            // Open the dialog box modally
            if (dlg.ShowDialog() == false)
            {
                return;
            }

            var result = (dlg.DataContext as InstallUrlDialogViewModel).Input;
            if (string.IsNullOrEmpty(result))
            {
                return;
            }
        }

        private async Task LoadPopularAddons()
        {
            IsBusy = true;

            if(_popularAddons == null || !_popularAddons.Any())
            {
                _popularAddons = await _addonService.GetFeaturedAddons(SelectedClientType);
            }

            DisplayAddons.Clear();
            foreach (var addon in _popularAddons)
            {
                if(_addonService.IsInstalled(addon.ExternalId, SelectedClientType))
                {
                    continue;
                }

                var viewModel = _serviceProvider.GetService<PotentialAddonListItemViewModel>();
                viewModel.Addon = addon;
                viewModel.ClientType = SelectedClientType;

                DisplayAddons.Add(viewModel);
            }

            IsBusy = false;
        }
    }
}
