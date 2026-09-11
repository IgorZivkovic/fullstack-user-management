<?php

namespace App\Providers;

use App\Models\User;
use App\OpenApi\UserManagementApiDocumentation;
use App\Policies\UserPolicy;
use Dedoc\Scramble\Scramble;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);

        Scramble::configure()
            ->expose(
                ui: 'api/v1/docs',
                document: 'api/v1/docs/openapi.json',
            )
            ->resolveOperationMethodsUsing(function (Route $route): string|array {
                $methods = array_values(array_diff(
                    array_map('strtolower', $route->methods()),
                    ['head'],
                ));

                return count($methods) === 1 ? $methods[0] : $methods;
            })
            ->withDocumentTransformers(UserManagementApiDocumentation::class);

        RateLimiter::for('login', fn (Request $request): Limit => Limit::perMinute(
            config('auth.login_rate_limit'),
        )->by($request->ip()));
    }
}
