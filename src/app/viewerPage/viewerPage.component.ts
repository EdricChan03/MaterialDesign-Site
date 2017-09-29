import { Component } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ViewerService } from './viewerPage.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Sidebar } from './sidebar/sidebar.model';
import { SidebarItem } from './sidebar/sidebarItem.model';

declare var Remarkable: any;
declare var hljs: any;

@Component({
  selector: 'mdi-viewer',
  templateUrl: './viewerPage.component.html',
  styleUrls: ['./viewerPage.component.scss'],
  providers: [
    ViewerService
  ]
})
export class ViewerPageComponent  {

  remarkable = new Remarkable({
    html: true
  });
  errorMessage: string;
  title: string = 'Loading...';
  pageData: SafeHtml = 'Loading...';
  file: string = 'error';
  url: string = '';
  linkIcon: string = 'M10.59,13.41C11,13.8 11,14.44 10.59,14.83C10.2,15.22 9.56,15.22 9.17,14.83C7.22,12.88 7.22,9.71 9.17,7.76V7.76L12.71,4.22C14.66,2.27 17.83,2.27 19.78,4.22C21.73,6.17 21.73,9.34 19.78,11.29L18.29,12.78C18.3,11.96 18.17,11.14 17.89,10.36L18.36,9.88C19.54,8.71 19.54,6.81 18.36,5.64C17.19,4.46 15.29,4.46 14.12,5.64L10.59,9.17C9.41,10.34 9.41,12.24 10.59,13.41M13.41,9.17C13.8,8.78 14.44,8.78 14.83,9.17C16.78,11.12 16.78,14.29 14.83,16.24V16.24L11.29,19.78C9.34,21.73 6.17,21.73 4.22,19.78C2.27,17.83 2.27,14.66 4.22,12.71L5.71,11.22C5.7,12.04 5.83,12.86 6.11,13.65L5.64,14.12C4.46,15.29 4.46,17.19 5.64,18.36C6.81,19.54 8.71,19.54 9.88,18.36L13.41,14.83C14.59,13.66 14.59,11.76 13.41,10.59C13,10.2 13,9.56 13.41,9.17Z';
  sidebar: Sidebar;

  constructor (public route: ActivatedRoute,
               private viewerService: ViewerService,
               private sanitizer: DomSanitizer) {
      this.url = route.snapshot.url.join('/');
      this.sidebar = new Sidebar(this.url, [
        new SidebarItem("home", "Loading...", "", "", [])
      ]);
  }

  loadContent (data) {
    let regex = new RegExp('<h1>(.*)</h1>');
    let title = 'Loading...';
    var linkIcon = this.linkIcon;
    var url = this.url;
    this.file = data.file;
    this.viewerService.getMarkdownFileHtml(data.file)
                      .subscribe(markdown => {
                        markdown = this.remarkable.render(markdown);
                        markdown = markdown.replace(regex, (sub, h1) => {
                          title = h1;
                          return '';
                        });
                        markdown = markdown.replace(new RegExp('<(h[2-6])>([^<]+)</h[2-6]>', 'g'), function (m1, m2, m3) {
                          let id = m3.toLowerCase().replace(/ /g, '-').replace(/\//, '');
                          return `<${m2} id="${id}">
                            ${m3}
                            <a href="${url}#${id}" style="display:inline-block;vertical-align:middle;">
                              <svg viewBox="0 0 24 24" style="width:18px;height:18px;">
                                <path d="${linkIcon}" fill="#999" />
                              </svg>
                            </a>
                          </${m2}>`;
                        })
                        this.title = title;
                        this.pageData = this.sanitizer.bypassSecurityTrustHtml(markdown);
                        setTimeout(function () {
                          let items = document.querySelectorAll('pre code');
                          for(var i = 0; i < items.length; i++) {
                            hljs.highlightBlock(items[i]);
                          }
                        }, 500);
                      },
                      e => this.errorMessage = e);
    this.viewerService.getSidebar()
                      .subscribe(sidebars => {
                        this.sidebar = sidebars.find(sidebar => sidebar.url === this.url);
                      });
  }

  ngOnInit() {
    this.route
      .data
      .subscribe(x => this.loadContent(x))
  }

  ngOnDestroy() {
    //this.sub.unsubscribe();
  }
}